/**
 * @author Ian McLaughlin <mclauia@gmail.com>
 *
 * @description
 *      Creates a createReducer function enhanced by beforeReduceEnhancers and afterReduceEnhancers
 *      Think of them like extra reducer functions that you can tack onto the beginning or end of each reducer
 *
 *      Also validates that your enhancers have been defined correctly
 *
 * @param {Object} initialState the initial state of this state domain
 * @param {Object} handlerMap   an object where keys are action types and
 *                                  values are reducer functions of the form (state,action) => newState
 *
 * @return {Function} a createReducer function
 */
export default function createReducerFactory(beforeReduceEnhancers = [], afterReduceEnhancers = []) {
  if (__DEV__) {
    /* eslint no-param-reassign: 0 */
    // deal wif it (⌐■_■)
    beforeReduceEnhancers = validateEnhancers('before', beforeReduceEnhancers);
    afterReduceEnhancers = validateEnhancers('after', afterReduceEnhancers);
  }

  /**
   * @description
   *      Creates a reducer function that will map action types to handler functions.
   *      ActionHandlers should be a plain object where the keys are action types and the values are reducer functions
   *
   *      Also validates that your handlerMap has been defined correctly
   *
   * @param {Object} initialState the initial state of this state domain
   * @param {Object} handlerMap   an object where keys are action types and
   *                                  values are reducer functions of the form (state,action) => newState
   *
   * @return {Function} a reducer function
   */
  return function createReducer(initialState, handlerMap) {
    if (__DEV__) {
      /* eslint no-param-reassign: 0 */
      handlerMap = validateHandlerMap(handlerMap);
    }

    /**
     * @description
     *      A regular old reducer function that invokes handlers based on action type.
     *
     * @param {Object} previousState  the previous state
     * @param {Object} action         the action object
     *
     * @return {Object} the new state, or a reference to the unchanged previous state
     */
    return (previousState = initialState, action) => {
      let nextState;

      const actionType = action.type;

      const handler = handlerMap[actionType];

      const enhancedPreviousState = beforeReduceEnhancers
        .reduce(
          (chainedEnhancedState, enhancer) => enhancer(handler, initialState, chainedEnhancedState),
          previousState
        );

      nextState = handler ? handler(enhancedPreviousState, action) : enhancedPreviousState;

      const enhancedNextState = afterReduceEnhancers
        .reduce(
          (chainedEnhancedState, enhancer) => (
            // afterReduceEnhancers get access to what the state looked like just before action handler
            enhancer(handler, initialState, enhancedPreviousState, chainedEnhancedState)
          ),
          nextState
        );

      return enhancedNextState;
    }
  }
}

export const createReducer = createReducerFactory();

function warnBadEnhancerArray(location, input) {
  console.error(
    `createReducerFactory: Expected enhancer array in ${location}ReduceEnhancers, `
    + `instead found ${typeof input}: `,
    input
  );
  console.trace();
}

function warnBadEnhancer(location, enhancer) {
  console.error(
    `createReducerFactory: Expected enhancer function in ${location}ReduceEnhancers array, `
    + `instead found ${typeof enhancer}: `,
    enhancer
  );
  console.trace();
}

// enforces enhancer arrays. enforces enhancer functions, removes non-functions with console errors
function validateEnhancers(location, enhancers) {
  const validatedEnhancers = [];
  if (!Array.isArray(enhancers)) {
    warnBadEnhancerArray(location, enhancers);
  } else {
    enhancers.forEach(enhancer => {
      if (!enhancer instanceof Function) {
        warnBadEnhancer(location, enhancer);
      } else {
        validatedEnhancers.push(enhancer);
      }
    })
  }

  return validatedEnhancers;
}

// enforces handler functions, removes non-functions with console errors
function validateHandlerMap(handlerMap) {
  const validatedHandlerMap = {};
  let actionType;
  for (actionType in handlerMap) {
    if (handlerMap.hasOwnProperty(actionType)) {
      const handler = handlerMap[actionType];
      if (!(handler instanceof Function)) {
        console.error(
          `createReducer: Expected reducer function for ${actionType} in handler object, `
          + `instead found ${typeof handler}: `,
          handler
        );
        console.trace();
      } else {
        validatedHandlerMap[actionType] = handler;
      }
    }
  }
  return validatedHandlerMap;
}
