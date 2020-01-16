const express = require('express');
const mysql = require('mysql');
const PDFDocument = require('pdfkit');
const QRCode = require('qrcode');
const fs = require('fs');

const router = express.Router();

const db = mysql.createConnection({
  host: process.env.HOST,
  user: process.env.USER,
  password: process.env.PASSWORD,
  database: process.env.DATABASE,
});

db.connect();

router.post('/login', async (req, res) => {
  const name = req.body.name;
  const sessionCode = req.body.sessionCode;

  if (!name || !sessionCode) {
    return res.status(400).json({
      message: 'Name or session code is blank.',
    });
  }

  if (name === 'admin' && sessionCode === 'xiaoxingxing') {
    return res.status(200).json({
      message: '',
    });
  } else if (name === 'admin') {
    return res.status(401).json({
      message: 'Cannot use admin as name',
    });
  }

  db.query(
    'SELECT date_id = CURDATE() AS valid FROM sessions WHERE passcode = ?',
    [sessionCode],
    (error, result) => {
      if (error) {
        return res.status(500).json({
          message: error,
        });
      }

      if (result.length > 0) {
        if (result[0].valid) {
          return res.status(200).json({
            message: '',
          });
        }
      }

      return res.status(401).json({
        message: 'Invalid session code.',
      });
    }
  );
});

router.get('/sessions', async (req, res) => {
  db.query(`
    SELECT DATE_FORMAT(date_id, '%W, %Y-%m-%d') AS date,
      DATE_FORMAT(date_id, '%Y-%m-%d') AS session_id,
      passcode 
    FROM sessions`, (error, result) => {
    if (error) {
      return res.status(500).json({
        message: error,
      });
    }

    return res.status(200).json(result);
  });
});

router.get('/students', async (req, res) => {
  db.query(`SELECT * FROM students`, (error, result) => {
    if (error) {
      return res.status(500).json({
        message: error,
      });
    }

    return res.status(200).json(result);
  });
});

router.get('/attendance', async (req, res) => {
  db.query(`
    SELECT student_id, scanner, DATE_FORMAT(session_date, '%Y-%m-%d') as session_date, flag, timestamp
    FROM attendance`, (error, result) => {
    if (error) {
      return res.status(500).json({
        message: error,
      });
    }

    return res.status(200).json(result);
  });
});

router.post('/checkin', async (req, res) => {
  const studentID = req.body.studentID;
  const scanner = req.body.scanner;
  const sessionCode = req.body.sessionCode;
  const flag = req.body.flag;

  if (!studentID || !sessionCode) {
    return res.status(400).json({
      message: 'Student ID or session code is blank.',
    });
  }

  db.query('SELECT passcode FROM sessions WHERE date_id = CURDATE()', (passcodeError, passcodeResult) => {
    if (passcodeError) {
      return res.status(500).json({
        message: 'Database error',
      });
    }

    if (passcodeResult[0].passcode !== sessionCode) {
      return res.status(401).json({
        message: 'Unauthorized',
      });
    }

    if (Number.isInteger(studentID)) {
      return res.status(401).json({
        message: 'Invalid Code',
      });
    }

    db.query('SELECT firstname, lastname FROM students WHERE id = ?', [studentID], (nameError, nameResult) => {
      if (nameError) {
        return res.status(500).json({
          message: 'Database error',
        });
      }

      console.log(nameResult);

      if (nameResult.length === 0) {
        return res.status(200).json({
          result: 'invalid',
        });
      }

      const formattedName = `${nameResult[0].firstname} ${nameResult[0].lastname}`;

      db.query(`
        SELECT DATE_FORMAT(timestamp, '%l:%i:%s %p') as time
        FROM attendance
        WHERE session_date = CURDATE() AND (flag = ? OR flag = 'in') AND student_id = ?
      `, [flag, studentID], (error, existsResult) => {
        if (error) {
          return res.status(500).json({
            message: 'Database Error ' + error,
          });
        }

        if (existsResult.length === 1 && flag === 'in' || existsResult.length === 2 && flag === 'out') {
          return res.status(200).json({
            result: 'exists',
            name: formattedName,
            detail: existsResult[0].time,
          });
        } else if (existsResult.length === 0 && flag === 'out') {
          return res.status(200).json({
            result: 'no-in',
            name: formattedName,
          });
        }

        db.query(`
          INSERT INTO attendance (student_id, scanner, session_date, flag, timestamp)
          VALUES (?, ?, CURDATE(), ?, NOW())
        `, [studentID, scanner, flag] , (error) => {
          if (error) {
            return res.status(500).json({
              message: 'Database Error ' + error,
            });
          }
    
          return res.status(200).json({
            result: 'valid',
            name: formattedName,
          });
        });
      });

    });
  });
});

router.post('/createSession', async (req, res) => {
  const codeCharacters = '0123456789';

  code = '';
  for (let i = 0; i < 6; i++) {
    code += codeCharacters.charAt(Math.floor(Math.random() * codeCharacters.length));
  }

  db.query(`
    INSERT INTO sessions (date_id, passcode)
    VALUES (CURDATE(), ?) 
    ON DUPLICATE KEY UPDATE passcode=?`,
    [code, code],
    (error) => {
      if (error) {
        return res.status(500).json({
          message: `Error: ${error}`,
        });
      }

      return res.status(200).json({
        code,
        message: 'Session successfully created',
      });
    }
  );

});

router.post('/updateStudents', async (req, res) => {
  const csvData = req.body.data;
  const firstRow = csvData[0];
  
  const idIndex = firstRow.indexOf('Students ID');
  const firstNameIndex = firstRow.indexOf('First Name');
  const lastNameIndex = firstRow.indexOf('Last Name');

  if (idIndex < 0 || firstNameIndex < 0 || lastNameIndex < 0) {
    return res.status(400).json({
      message: `CSV is missing one or more columns: 'First Name', 'Last Name', or 'Students ID'`
    });
  }

  const valuesToInsert = [];

  for (let i = 1; i < csvData.length; i++) {
    const row = csvData[i];
    if (row[idIndex]) {
      const valueArray = [row[idIndex], row[firstNameIndex].trim(), row[lastNameIndex].trim()];
      valuesToInsert.push(valueArray);
    }
  }

  const result = await db.query(
    'INSERT INTO students (id, firstname, lastname) VALUES ? ON DUPLICATE KEY UPDATE firstname=VALUES(firstname), lastname=VALUES(lastname)',
    [valuesToInsert],
  );

  const doc = new PDFDocument();
  const output = fs.createWriteStream('./codes.pdf');
  doc.pipe(output);

  const colSpace = 190;
  const rowSpace = 170;
  const colOff = 60;
  const rowOff = 60;

  let row = 0;
  let col = 0;
  for (let i = 0; i < valuesToInsert.length; i++) {
    try {
      const qrURL = await QRCode.toDataURL(valuesToInsert[i][0], {
        errorCorrectionLevel: 'Q'
      });
      doc.image(qrURL, col * colSpace + colOff, row * rowSpace + rowOff);
      doc.fontSize(10);
      doc.font('Helvetica').text(`${valuesToInsert[i][0]}`, col * colSpace + colOff, row * rowSpace + rowOff + 110, {
        width: 120,
        align: 'center',
      });
      doc.fontSize(14);
      doc.font('Helvetica-Bold').text(`${valuesToInsert[i][1]} ${valuesToInsert[i][2]}`, col * colSpace + colOff, row * rowSpace + rowOff + 125, {
        width: 120,
        height: 40,
        align: 'center',
        lineGap: 0.5,
        lineBreak: false,
        ellipsis: true,
      });
      
      col++;
      
      if (col > 2) {
        col = 0;
        row++;
      }

      if (row > 3) {
        row = 0;
        doc.addPage();
      }

    } catch (error) {
      return res.status(400).json({
        message: `Error generating QR Codes at row ${i + 2}`,
      });
    }
  }

  doc.end();
  output.on('finish', () => {
    fs.readFile('./codes.pdf', 'base64', (error, data) => {
      if (error) throw error;
      res.status(200).send(data);
    });
  })
});

module.exports = router;
