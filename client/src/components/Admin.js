import React from 'react';
import { Button, Form, Accordion, Card } from 'react-bootstrap';
import Axios from 'axios';
import Papa from 'papaparse';
import moment from 'moment';
import './Admin.css';


const Admin = (props) => {
  const [sessions, updateSessions] = React.useState([]);
  const [students, updateStudents] = React.useState({});
  const [attendance, updateAttendance] = React.useState({});
  const [csv, updateCSV] = React.useState([]);
  const [uploading, updateUploading] = React.useState(false);

  const fetchAttendance = async () => {
    const attendance = await Axios.get('/api/attendance');

    const attendanceMap = {};
    for (const record of attendance.data) {
      if (!attendanceMap[record.session_date]) {
        attendanceMap[record.session_date] = {};
      }

      if (!attendanceMap[record.session_date][record.student_id]) {
        attendanceMap[record.session_date][record.student_id] = [];
      }

      attendanceMap[record.session_date][record.student_id].push(record);
    }
    updateAttendance(attendanceMap);
  };

  React.useEffect(() => {
    const initialize = async () => {
      const [sessions, students] = await Promise.all([
        Axios.get('/api/sessions'),
        Axios.get('/api/students'),
      ]);
      fetchAttendance();
      updateSessions(sessions.data);

      const studentMap = {};
      for (const student of students.data) {
        studentMap[student.id] = student;
      }
      updateStudents(studentMap);
    };

    initialize();
  }, []);

  const getNamesPresent = (sessionID) => {
    if (!attendance[sessionID]) {
      return null;
    }

    return Object.values(attendance[sessionID]).reduce((presentNames, userRecordArray) => {
      if (userRecordArray.length === 1) {
        const student = students[userRecordArray[0].student_id];
        presentNames.push(
          <p key={student.id} className='Admin-Name'>{student.firstname} {student.lastname}</p>
        );
      }
      return presentNames;
    }, []);
  };

  const getNamesAttended = (sessionID) => {
    if (!attendance[sessionID]) {
      return null;
    }

    return Object.values(attendance[sessionID]).reduce((attendedNames, userRecordArray) => {
      if (userRecordArray.length === 2) {
        const student = students[userRecordArray[0].student_id];
        attendedNames.push(
          <p key={student.id} className='Admin-Name'>{student.firstname} {student.lastname}</p>
        );
      }
      return attendedNames;
    }, []);
  }

  const getSessions = () => {
    return sessions.map((session) => {
      return (
        <Card key={session.date} style={{ textAlign: 'left' }} >
          <Accordion.Toggle as={Card.Header} eventKey={session.date} style={{ cursor: 'pointer' }}>
            {session.date} - {session.passcode}
          </Accordion.Toggle>
          <Accordion.Collapse eventKey={session.date}>
            <Card.Body>
              <div className='Admin-NameCategory'>
                <h4>Checked-In</h4>
                <div className='Admin-Nameset'>
                  {getNamesPresent(session.session_id)}
                </div>
              </div>
              <div className='Admin-NameCategory'>
                <h4>Checked-Out</h4>
                <div className='Admin-Nameset'>
                  {getNamesAttended(session.session_id)}
                </div>
              </div>
            </Card.Body>
          </Accordion.Collapse>
        </Card>
      );
    });
  };

  const handleFileUpload = (event) => {
    const target = event.target;
    const fileList = target.files;
    if (fileList.length !== 1) {
      // throw error
      console.log('error');
    }

    const file = fileList[0];
    if (!file.name.endsWith('.csv')) {
      console.log('not csv');
    }

    const parseResult = (result) => {
      const csvData = result.data;
      if (csvData.length < 1) {
        console.log('empty');
      }
      if (csvData.length === 1) {
        console.log('no content');
      }
      console.log(result);
      updateCSV(result.data);
    }

    Papa.parse(file, {
      complete: parseResult,
      skipEmptyLines: true,
      keepEmptyRows: false,
    });
  };

  const handleCreateSession = async () => {
    const result = await Axios.post('/api/createSession');

    if (result.status === 200) {
      const curDateString = moment().format('dddd, YYYY-MM-DD');
      console.log(curDateString);
      const newSessions = [];
      
      let dateExists = false;
      for (let i = 0; i < sessions.length; i++) {
        if (sessions[i].date === curDateString) {
          newSessions.push({
            date: curDateString, 
            passcode: result.data.code
          });
          dateExists = true;
        } else {
          newSessions.push(sessions[i]);
        }
      }

      if (!dateExists) {
        newSessions.push({
          date: curDateString, 
          passcode: result.data.code
        });
      }

      updateSessions(newSessions);
    } else {
      console.log('Try Again');
    }
  };

  return (
    <div className='Admin'>
      <section>
        <h1>Sessions</h1>
        <Form.Group>
          <Button variant='outline-primary' onClick={() => fetchAttendance()}>Update Attendance</Button>
        </Form.Group>
        <Accordion>
          {getSessions()}
        </Accordion>

        <Button className='Admin-Button' onClick={() => handleCreateSession()}>Create Session</Button>
      </section>

      <section>
        <h1>Students</h1>
        <div>
          <Form className='Admin-Form'>
            <Form.Control
              onChange={handleFileUpload}
              className='Admin-Upload'
              type='file' />
            <Button 
              onClick={async () => {
                updateUploading(true);
                const result = await Axios.post('/api/updateStudents', {
                  data: csv,
                });
                const linkSource = `data:application/pdf;base64,${result.data}`;
                const downloadLink = document.createElement('a');
                const fileName = 'qr-codes.pdf';

                downloadLink.href = linkSource;
                downloadLink.download = fileName;
                downloadLink.click();
                updateUploading(false);
              }}
              className='Admin-Upload-Button'
              disabled={uploading || csv.length === 0}>
              Upload
            </Button>
          </Form>
        </div>
      </section>
      
      <Button
        className='Admin-Button'
        variant='outline-secondary'
        onClick={() => props.back()}>
        Go Back
      </Button>
    </div>
  );
};

export default Admin;
