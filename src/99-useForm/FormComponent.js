import useForm from "./useForm"

export default function SizeComponent() {
  const { state, isFormValid, handleSubmit, fieldBind, resetField, disableField, resetForm, disableForm } = useForm(initialState, reducer)

  const divStyle = {
    display: "flex",
    gap: "10px",
    flexDirection: "column",
  };

  const formStyle = {
    display: "flex",
    flexDirection: "column",
    gap: "10px",
    width: "50%",
  }

  return (
    <div style={divStyle}>
      <div>Name: {JSON.stringify(state.name)}</div>
      <div>Product: {JSON.stringify(state.product)}</div>
      <div>isFormValid: {isFormValid}</div>
      <input type='text' {...fieldBind('name')} />
      <select {...fieldBind('product')}>
        <option value={-1}>Choose One</option>
        <option value={1}>option 1</option>
        <option value={2}>option 2</option>
      </select>
      <button onClick={() => resetField('name')}>RESET FIELD</button>
      <button onClick={() => resetForm()}>RESET FORM</button>
      <button onClick={() => disableField('product')}>DISABLE FIELD</button>
      <button onClick={() => disableForm()}>DISABLE FORM</button>
      <button onClick={() => handleSubmit(successAction)}>SUBMIT FORM</button>
    </div>
  )
}

function successAction(state) {
  alert(`Name: ${state.name.value}, Product: ${state.product.value}`)
}

const initialState = {
  name: { value: '', dispatch: 'DIRECT', validations: ['required'], pattern: '', disabled: false, touched: false, hasError: false, error: ''},
  product: { value: -1, dispatch: 'DIRECT', validations: ['select_required'], pattern: '', disabled: false, touched: false, hasError: false, error: ''},
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
    case 'RESET':
      return { ...action.payload }
    default:
      return state;
  }
}
