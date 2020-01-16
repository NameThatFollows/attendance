CREATE TABLE students (
  id INT NOT NULL,
  firstname VARCHAR(64) NOT NULL,
  lastname VARCHAR(64) NOT NULL,
  PRIMARY KEY (id)
);

CREATE TABLE sessions (
  date_id DATE,
  passcode VARCHAR(8),
  PRIMARY KEY (date_id)
);

CREATE TABLE attendance (
  id INT NOT NULL AUTO_INCREMENT,
  student_id INT NOT NULL,
  scanner VARCHAR(255) NOT NULL,
  session_date DATE NOT NULL,
  flag VARCHAR(16) NOT NULL,
  timestamp datetime NOT NULL,
  PRIMARY KEY (id),
  FOREIGN KEY (student_id)
    REFERENCES students(id)
    ON UPDATE CASCADE ON DELETE CASCADE,
  FOREIGN KEY (session_date)
    REFERENCES sessions(date_id)
    ON UPDATE CASCADE ON DELETE CASCADE
);
