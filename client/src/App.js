import React from 'react';
import './App.css';
import Start from './components/Start';
import Footer from './Footer';
import Scan from './components/Scan';
import Admin from './components/Admin';

const reducer = (state, action) => {
  switch (action.type) {
    case 'show-admin':
      return { ...state, appState: 'admin', name: 'admin' };
    case 'show-home':
      return { ...state, appState: 'start', name: '', sessionCode: '' };
    case 'start-session':
      return {
        ...state,
        appState: 'scan',
        name: action.name,
        sessionCode: action.sessionCode
      };
    default:
      return state;
  }
};

const initialState = {
  appState: 'start',
  name: '',
  sessionCode: '',
};

function App() {
  const [state, dispatch] = React.useReducer(reducer, initialState);

  const goBack = () => {
    dispatch({ type: 'show-home', name: '', sessionCode: '' });
  };

  const showStart = () => {
    if (state.appState !== 'start') {
      return null;
    }

    return (
      <Start
        login={(name, sessionCode) => dispatch({
            type: 'start-session',
            name,
            sessionCode,
          })
        }
        loginAdmin={() => dispatch({
          type: 'show-admin',
        })} />
    );
  };

  const showScan = () => {
    if (state.appState !== 'scan') {
      return null;
    }

    return (
      <Scan sessionCode={state.sessionCode} name={state.name} back={goBack} />
    );
  };

  const showAdmin = () => {
    if (state.appState !== 'admin' || state.name !== 'admin') {
      return null;
    }

    return <Admin back={goBack} />;
  }

  return (
    <div className='App'>
      {showStart()}
      {showScan()}
      {showAdmin()}
      <Footer />
    </div>
  );
}

export default App;
