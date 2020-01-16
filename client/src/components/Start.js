import React from 'react';
import { Form, Button } from 'react-bootstrap';

import './Start.css';
import Axios from 'axios';

const Start = (props) => {
  const [name, updateName] = React.useState('');
  const [sessionCode, updateSessionCode] = React.useState('');
  const [error, changeError] = React.useState('');

  const handleSubmit = async (event) => {
    event.preventDefault();
    event.stopPropagation();

    if (name && sessionCode) {
      try {
        const loginResult = await Axios.post('/api/login', {
          name,
          sessionCode,
        });

        console.log(loginResult);
        
        if (name === 'admin') {
          props.loginAdmin();
        } else {
          props.login(name, sessionCode);
        }
      } catch (error) {
        changeError(error.response.data.message);
      }
    }
  };

  return (
    <div className='Start'>
      <header>
        <h1>Attendance</h1>
      </header>
      <Form onSubmit={handleSubmit}>
        <p>{error}</p>
        <Form.Group>
          <Form.Control
            size='lg'
            placeholder='Enter Name'
            required
            onChange={(event) => updateName(event.target.value)} />
          <Form.Control.Feedback type="invalid">
            Please input your name.
          </Form.Control.Feedback>
        </Form.Group>
        <Form.Group>
          <Form.Control
            size='lg'
            placeholder={name === 'admin' ? 'Enter Password' : 'Enter Session Code'}
            required
            type={name === 'admin' ? 'password' : ''}
            onChange={(event) => updateSessionCode(event.target.value)} />
          <Form.Control.Feedback type="invalid">
            Please input the session code.
          </Form.Control.Feedback>
        </Form.Group>
        <p>Please turn up your volume.</p>
        <Button
          className='Start-Button'
          size='lg'
          variant='primary'
          type='submit'>
          Start Scanning
        </Button>
      </Form>
    </div>
  );
}

export default Start;
