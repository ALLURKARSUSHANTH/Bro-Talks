import { createStore } from 'redux';
import rootReducer from './reducers/authReducers';

const store = createStore(rootReducer);

export default store;