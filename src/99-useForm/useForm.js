import { useReducer, useState, useEffect } from "react"

/**
 * @param {object} initialState - The initial state for the form
 * @param {function} reducer - The reducer that will handle the changes in state, since a form could have special requirements like disabling a field when another is selected it was decided that it would be better to send it as a parameter.
 * @return {Object} - It will return a series of functions to handle the state of the form.
*/
export default function useForm(initialState, reducer) {
  const [state, dispatch] = useReducer(reducer, initialState)
  const [isFormValid, setIsFormValid] = useState(false)

  /** 
   * @param {string} name - The name of the field to bind, it should be the same as the attribute name on the state.
   * @return {Object} - Attributes commonly bound to an input field.
   * @example
   *  fieldBind('name')
  */
  function fieldBind(name) {
    let fieldState = state[name]
    let value = fieldState.value
    return {
      value: value,
      id: name + '_field',
      name: name,
      disabled: fieldState.disabled,
      onChange: e => handler(e, fieldState, dispatch)
    }
  }

  /**
   * An effect to verify the overall validity of the form when the state has changed.
   */
  useEffect(() => {
    setIsFormValid(checkFormValidity(state))
  }, [state])

  /**
   * @param {function} action - The action that should be performed if the validations pass when submitting the form.
   * Due to requirements if the validation fails a rejected promise is returned.  
   */
  const handleSubmit = (action) => {
    let proceedWithSubmission = true
    for (const key in state) {
      let fieldState = state[key]
      let value = fieldState.value
      const { passes, message } = fieldValidation(fieldState.validations, fieldState.pattern, value, state)
      if (!passes) proceedWithSubmission = false
      dispatch({ type: 'VALIDATION', field: key, hasError: !passes, message: message })
    }
    if (!proceedWithSubmission) return Promise.reject() //could just return if the caller does not expect a promise
    action(state)
  }

  /**
   * @param {string} name - The name of the field that should to reset
   */
  const resetField = (name) => {
    let reset = { [name]: { ...initialState[name] } }
    dispatch({ type: 'RESET', payload: { ...state, ...reset } })
  }

  /**
   * A shortcut to dispatching a 'RESET' order for any particular field
   */
  const resetForm = () => {
    debugger
    let newState = copyObject(initialState)
    dispatch({ type: 'RESET', payload: { ...newState } })
  }

  /**
   * @param {string} name  - The name of the field that should be disabled
   */
  const disableField = (name) => {
    let disabled = { [name]: { ...state[name], disabled: true } }
    dispatch({ type: 'RESET', payload: { ...state, ...disabled } })
  }

  /**
   * A shortcut to disabling all the fields in the form, reuses the 'RESET' order, could be changed to make it more evident.
   */
  const disableForm = () => {
    let disabledForm = copyObject(state)
    for (const key in state) disabledForm[key].disabled = true;
    dispatch({ type: 'RESET', payload: { ...disabledForm } })
  }

  return {
    state, //The state of the form, to use the values or other attributes as needed in the component that uses it.
    isFormValid, //The overall validity of the form
    handleSubmit, //The function that should be used to execute validations before submitting
    fieldBind, //The function that will bind attributes to the input
    resetField, disableField, //Controllers for individual fields
    resetForm, disableForm //Controllers for the form as a whole
  }
}

/**
 * 
 * @param {Object} state - The overall state of the form
 * @returns {Boolean} If the form is valid or not.
 * Just a small function to check if any field on the form has been deemed unvalid.
 */
function checkFormValidity(state) {
  let formIsValid = true
  for (const key in state) {
    if (state[key].hasError) formIsValid = false
  }
  return formIsValid
}

/**
 * 
 * @param {Event} e - The change event of the input field
 * @param {Object} fieldState - The state of that particular field at the moment of the action
 * @param {Function} dispatch - The dispatch function of the reducer
 * This handler will execute onChange, since it's the onChange part of the fieldBind function
 */
const handler = (e, fieldState, dispatch) => {
  let value
  let current
  let field = e.target.name
  value = e.target.value
  current = fieldState.value
  const { passes, message } = fieldValidation(fieldState.validations, fieldState.pattern, value)
  const modified = value !== current
  dispatch({ type: fieldState.dispatch, field: field, payload: value, touched: modified, hasError: !passes, message: message })
}

/**
 * 
 * @param {Array} validations - Should be an array of validations that a field needs to pass
 * @param {string} pattern - Pattern was originally just a regex string that some fields might use
 * @param {Any} value - The new value that is meant to be used
 * @returns 
 */
function fieldValidation(validations, pattern, value) {
  if (validations.length === 0) return { passes: true, message: '' }
  for (let i = 0; i < validations.length; i++) {
    let { valid, message } = validate(validations[i], value, pattern)
    if (!valid) return { passes: false, message: message }
  }
  return { passes: true, message: '' }
}

/**
 * 
 * @param {string} validation - The action that should be evaluated
 * @param {Any} value - The new value meant to be evaluated
 * @param {string} pattern - If the value should comply with a regex expression it's also included.
 * @returns {Object} { valid - Boolean, message - string }
 * This function will return the validation state for a particular field and an error message if it's needed, this allows for specific messages to be displayed depending on what exactly goes wrong during validation to inform the user properly.
 * This could be refactored using an array of functions as the required validations, which would remove the switch.
 */
function validate(validation, value, pattern) {
  switch (validation) {
    case 'required':
      return value !== '' ? { valid: true, message: '' } : { valid: false, message: 'El campo es requerido.' }
    case 'select_required':
      return value !== -1 ? { valid: true, message: '' } : { valid: false, message: 'El campo es requerido.' }
    case 'pattern':
      return checkPattern(value, pattern) ? { valid: true, message: '' } : { valid: false, message: 'El campo no tiene el formato adecuado.' }
    default:
      return { valid: true, message: '' }
  }
}

/**
 * 
 * @param {string} value - The string value to be tested against the regex
 * @param {string} pattern - RegEx expression
 * @returns Boolean
 */
function checkPattern(value, pattern) {
  if (!pattern || pattern === '') return true
  let regex = new RegExp(pattern + '$');
  return regex.test(value)
}

/**
 * 
 * @param {Object} state - The state of the form, needed to gather all the fields in relation to the one in question
 * @param {Array} pattern - An array indicating all the names of the fields that could be filled
 * @returns Boolean
 */
function checkIfOneIsChecked(state, pattern) {
  for (const element of pattern) {
    if (state[element].value === true) return true
  }
  return false
}

//A quick function to prevent altering the original reference
function copyObject(obj) {
  let newObj = {}
  for (const key in obj) newObj[key] = { ...obj[key] }
  return newObj
}

/*
Disclaimer: So far I am using my hook on forms that use text, numeric, select and checkbox inputs, the checkbox logic has been removed from this hook since
I needed to check all, or "at least one" of the options, also due to requirements I had to keep the objects related to a Selected option so I had values that were objects, 
that complicates matters somewhat since the handler would need to have some extended logic to capture the correct values (boolean or the option value) before proceeding.
The Validations as seen in Kyle video about hooks could be instead functions, so they could be moved to an entirely different file and the hook could just get an array of functions 
to execute, that would probably be a new version of the hook.
*/