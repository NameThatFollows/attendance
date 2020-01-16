import React from 'react';
import QrReader from 'react-qr-reader';
import './Scan.css';
import { Nav, Button } from 'react-bootstrap';
import Pizz from 'pizzicato';
import Axios from 'axios';

function Scan(props) {
  const [resultText, changeResultText] = React.useState('Ready to Scan');
  const [resultTextDetail, changeResultTextDetail] = React.useState('');
  const [status, changeStatus] = React.useState('in');
  const [scanState, changeScanState] = React.useState('ready');

  const changeState = (newScanState, mainText, detailText) => {
    changeScanState(newScanState);
    switch (newScanState) {
      case 'ready':
        changeResultText('Ready to Scan');
        changeResultTextDetail('');
        break;
      case 'scanning':
        changeResultText('Please Wait...');
        playPrompt();
        break;
      case 'exists':
        changeResultText(mainText);
        changeResultTextDetail(`Checked-${status} at ${detailText}`);
        playNeutral();
        break;
      case 'valid':
        changeResultText(mainText);
        changeResultTextDetail(`Successfully checked-${status}`);
        playPositive();
        break;
      case 'no-in':
        changeResultText(`${mainText} Not Scanned`);
        changeResultTextDetail('Please check in first.');
        playNegative();
        break;
      case 'invalid':
        changeResultText('Invalid Code');
        playNegative();
        break;
      default:
        changeResultText('Error');
        playNegative();
        break;
    }
  };

  const handleScan = async (data) => {
    if (data && scanState === 'ready') {
      changeState('scanning');

      const result = await Axios.post('/api/checkin', {
        studentID: data,
        scanner: props.name,
        sessionCode: props.sessionCode,
        flag: status,
      });

      setTimeout(() => {
        if (result.status === 200) {
          if (result.data.result === 'valid') {
            changeState('valid', result.data.name);
          } else if (result.data.result === 'exists') {
            changeState('exists', result.data.name, result.data.detail);
          } else if (result.data.result === 'invalid') {
            changeState('invalid');
          } else if (result.data.result === 'no-in') {
            changeState('no-in', result.data.name);
          }
        } else {
          changeState('error');
        }
        setTimeout(() => {
          changeState('ready');
        }, 2000);
      }, 500);
    }
  };

  const getResultBackground = () => {
    switch (scanState) {
      case 'valid':
        return 'Positive';
      case 'invalid':
      case 'no-in':
        return 'Negative';
      case 'exists':
        return 'Neutral';
      default:
        return '';
    }
  };

  return (
    <div className='Scan'>
      <nav className='Scan-Nav'>
        <Nav variant='pills' justify activeKey={status}>
          <Nav.Item>
            <Nav.Link eventKey='in' onSelect={() => changeStatus('in')}>Check-In</Nav.Link>
          </Nav.Item>
          <Nav.Item>
            <Nav.Link eventKey='out' onSelect={() => changeStatus('out')}>Check-Out</Nav.Link>
          </Nav.Item>
        </Nav>
      </nav>
      <QrReader
        className='ScanWindow'
        delay={1000}
        onScan={handleScan}
        onError={(event) => console.log(event)}
      />
      <div className={
        `Result ${getResultBackground()}`}>
        {resultText}
        <div className='Detail'>
          {resultTextDetail}
        </div>
      </div>
      <Button
        className='Admin-Button'
        variant='outline-secondary'
        onClick={() => props.back()}>
        Go Back
      </Button>
    </div>
  );
}

const playPositive = () => {
  const positive = new Pizz.Sound({
    source: 'wave',
    options: {
        type: 'sine',
        frequency: 523.25,
        volume: 1,
        attack: 0,
        release: 0.5,
    },
  });

  setTimeout(() => {
    positive.stop();
  }, 200);
  positive.play();
};

const playNegative = () => {
  const negative = new Pizz.Sound({
    source: 'wave',
    options: {
        type: 'sawtooth',
        frequency: 100,
        volume: 0.75,
        attack: 0,
        release: 0.5,
    },
  });

  setTimeout(() => {
    negative.stop();
  }, 200);
  negative.play();
};

const playNeutral = () => {
  const neutral = new Pizz.Sound({
    source: 'wave',
    options: {
        type: 'sawtooth',
        frequency: 392.00,
        volume: 0.25,
        attack: 0,
        release: 0.5,
    },
  });

  setTimeout(() => {
    neutral.stop();
  }, 200);
  neutral.play();
};

const playPrompt = () => {
  const prompt = new Pizz.Sound({
    source: 'wave',
    options: {
        type: 'sine',
        frequency: 392.00,
        volume: 2,
        attack: 0,
        release: 0.5,
    },
  });

  setTimeout(() => {
    prompt.stop();
  }, 200);
  prompt.play();
};


export default Scan;
