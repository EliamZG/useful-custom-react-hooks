import useForm from "./useForm"

export default function SizeComponent() {
  const { state, isFormValid, handleSubmit, fieldBind, resetField, disableField, resetForm, disableForm } = useForm(initialState, reducer)

  const divStyle = {
    display: "flex",
    gap: "10px",
    flexDirection: "column",
  };

  const buttonsStyle = {
    display: "flex",
    flexDirection: "row",
    gap: "10px",
  }
  debugger
  return (
    <div style={divStyle}>
      <div>Name: {JSON.stringify(state.name)}</div>
      <div>Product: {JSON.stringify(state.product)}</div>
      <div>isFormValid: {isFormValid.toString()}</div>
      <input type='text' {...fieldBind('name')} />
      <select {...fieldBind('product')}>
        <option value={-1}>Choose One</option>
        <option value={1}>option 1</option>
        <option value={2}>option 2</option>
      </select>
      <div style={buttonsStyle}>
        <button onClick={() => resetField('name')}>RESET NAME FIELD</button>
        <button onClick={() => resetForm()}>RESET FORM</button>
        <button onClick={() => disableField('product')}>DISABLE PRODUCT FIELD</button>
        <button onClick={() => disableForm()}>DISABLE FORM</button>
        <button onClick={() => handleSubmit(successAction)}>SUBMIT FORM</button>
      </div>
    </div>
  )
}

function successAction(state) {
  alert(`Name: ${state.name.value}, Product: ${state.product.value}`)
}

/**
 * The state gets a little verbose since it carries all the specifics for each field, 
 * by changing the validations from strings to functions it could be uncoupled a little bit more,
 * it's also possible to use an object as the value, but then the TYPE should change and the hook 
 * should 'handle' the value accordingly to make validations work.  
 */
const initialState = {
  name: { value: '', dispatch: 'DIRECT', type: 'TEXT', validations: ['required'], pattern: '', disabled: false, touched: false, hasError: false, error: ''},
  product: { value: -1, dispatch: 'DIRECT', type: 'INTEGER', validations: ['select_required'], pattern: '', disabled: false, touched: false, hasError: false, error: ''},
}

/**
 * Just a caveat: all my reducers need a validation and reset action, but if a form has more complex logic
 * separating the reducer from the form can be a huge advantage, for example I have a bunch of fields that should
 * recalculate data on change or when one is selected I should disable one another, so I can create a new action for 
 * that specific case on that specific form to handle such behaviour.
 */
const reducer = (state, action) => {
  const data = state[action.field]
  switch (action.type) {
    case 'DIRECT':
      return { ...state, [action.field]: { ...data, value: action.payload, touched: action.touched, hasError: action.hasError, error: action.message } };
    case 'VALIDATION':
      return { ...state, [action.field]: { ...data, hasError: action.hasError, error: action.message } }
    case 'RESET': //I called this reset, but it could also be called update since it can be used to just set a new overall state
      return { ...action.payload }
    default:
      return state;
  }
}

/**
 * In practice I've been using this hook in some very complex forms with lots of fields (40+)
 * in those cases the state can get really big and the reducer might have very specific action types
 * so although I prefer short and contained code at least I know where to go looking for things, I keep 
 * a state.js file for each form so I can compare the initial state vs the reducer, while the hook needs to change
 * whenever a new type of data type is handled it's more common to just add action types to the reducer
 * to handle very specific situations like the trigger of a calculation of a field that depends on another.
 * Personally I have BOOLEAN, OBJECT, INTEGER and FLOAT as my types being handled on the hook, the TEXT is pretty much
 * the default behaviour.
 */
