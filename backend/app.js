var createError = require('http-errors');
var express = require('express');
var path = require('path');
//Logger that was used for debugging, commented later
// var logger = require('morgan');
var mysql;
try {
  mysql = require('mysql2'); // prefer mysql2 (supports caching_sha2_password)
  console.log('Using mysql2 client');
} catch (e) {
  mysql = require('mysql'); // fallback to mysql if mysql2 not installed
  console.log('mysql2 not installed — using mysql client');
}
var cors = require('cors');
var port = 3001

//Connection Info
var con = mysql.createConnection({
  host: 'localhost',
  user: 'root',
  password: 'root',
  database: 'HMS',
  multipleStatements: true
});

//Connecting To Database
con.connect(function (err) {
  if (err) {
    // Handle the MySQL 8 auth mismatch gracefully with instructions
    if (err.code === 'ER_NOT_SUPPORTED_AUTH_MODE') {
      console.error('MySQL authentication protocol not supported by client (ER_NOT_SUPPORTED_AUTH_MODE).');
      console.error('Two ways to fix this (pick one):');
      console.error('1) Install mysql2 and restart the server:');
      console.error('   npm install mysql2');
      console.error('   (then restart your app)');
      console.error('OR');
      console.error('2) Change the MySQL user authentication plugin to mysql_native_password (run in MySQL shell):');
      console.error("   ALTER USER 'root'@'localhost' IDENTIFIED WITH mysql_native_password BY 'root';");
      console.error('   FLUSH PRIVILEGES;');
      console.error('After performing (1) or (2) restart the backend.');
      process.exit(1);
    } else {
      console.error('Error connecting to MySQL:', err);
      process.exit(1);
    }
  } else {
    console.log("Connected to MySQL");
  }
});

//Variables to keep state info about who is logged in
var email_in_use = "";
var password_in_use = "";
var who = "";

var app = express();

app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'jade');

// app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(express.static(path.join(__dirname, 'public')));
app.use(cors({
  origin: ['http://localhost:3000', 'http://localhost:3001'], // Allow both origins
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

//Signup, Login, Password Reset Related Queries

//Checks if patient exists in database
app.get('/checkIfPatientExists', (req, res) => {
  let params = req.query;
  let email = params.email;
  let statement = `SELECT * FROM Patient WHERE email = "${email}"`;
  console.log(statement);
  con.query(statement, function (error, results, fields) {
    if (error) throw error;
    else {
      return res.json({
        data: results
      })
    };
  });
});

//Creates User Account
app.get('/makeAccount', (req, res) => {
  let query = req.query;
  let name = query.name + " " + query.lastname;
  let email = query.email;
  let password = query.password;
  let address = query.address;
  let gender = query.gender;
  let medications = query.medications;
  let conditions = query.conditions;
  let surgeries = query.surgeries;
  if(medications===undefined){
    medications="none"
  }
  if(conditions===undefined){
    conditions="none"
  }
  if(!surgeries===undefined){
    surgeries="none"
  }
  let sql_statement = `INSERT INTO Patient (email, password, name, address, gender) 
                       VALUES ` + `("${email}", "${password}", "${name}", "${address}", "${gender}")`;
  console.log(sql_statement);
  // First create patient record
  con.query(sql_statement, function (error, results, fields) {
    if (error) {
      console.error('Error creating patient:', error);
      return res.status(500).json({ error: 'Failed to create patient account' });
    }
    
    email_in_use = email;
    password_in_use = password;
    who = "pat";

    // Get next medical history ID
    con.query('SELECT COALESCE(MAX(id), 0) as maxId FROM MedicalHistory', function (error, results) {
      if (error) {
        console.error('Error getting max medical history ID:', error);
        return res.status(500).json({ error: 'Database error' });
      }

      const generated_id = (results[0].maxId || 0) + 1;
      
      // Create medical history record
      const historyInsert = `INSERT INTO MedicalHistory (id, date, conditions, surgeries, medication) 
                            VALUES (${generated_id}, curdate(), "${conditions || 'none'}", "${surgeries || 'none'}", "${medications || 'none'}")`;

      con.query(historyInsert, function (error) {
        if (error) {
          console.error('Error creating medical history:', error);
          return res.status(500).json({ error: 'Failed to create medical history' });
        }

        // Link history to patient
        con.query(`INSERT INTO PatientsFillHistory (patient, history) VALUES ("${email}", ${generated_id})`,
          function (error) {
            if (error) {
              console.error('Error linking history:', error);
              return res.status(500).json({ error: 'Failed to link medical history' });
            }
            res.json({ success: true });
          });
      });
    });
  });
});

//Checks If Doctor Exists
app.get('/checkIfDocExists', (req, res) => {
  let params = req.query;
  let email = params.email;
  let statement = `SELECT * FROM Doctor WHERE email = "${email}"`;
  console.log(statement);
  con.query(statement, function (error, results, fields) {
    if (error) throw error;
    else {
      return res.json({
        data: results
      })
    };
  });
});

//Makes Doctor Account
app.get('/makeDocAccount', (req, res) => {
  let params = req.query;
  let name = params.name + " " + params.lastname;
  let email = params.email;
  let password = params.password;
  let gender = params.gender;
  let schedule = params.schedule;
  let sql_statement = `INSERT INTO Doctor (email, gender, password, name) 
                       VALUES ` + `("${email}", "${gender}", "${password}", "${name}")`;
  console.log(sql_statement);
  con.query(sql_statement, function (error, results, fields) {
    if (error) {
      console.error('Error inserting Doctor:', error);
      return res.status(500).json({ error: 'Failed to create doctor', details: error.code || error.message });
    } else {
      // Set session state and reply to client immediately
      email_in_use = email;
      password_in_use = password;
      who = 'doc';
      res.json({ data: results });

      // Then attempt to insert schedule. If the table doesn't exist, create it then retry.
      let scheduleInsert = `INSERT INTO DocsHaveSchedules (sched, doctor) 
                       VALUES (${schedule}, "${email}")`;
      console.log(scheduleInsert);
      con.query(scheduleInsert, function(err){
        if (!err) {
          console.log('Inserted into DocsHaveSchedules');
          return;
        }
        console.error('DocsHaveSchedules insert failed:', err.code, err.sqlMessage || err.message);
        if (err.code === 'ER_NO_SUCH_TABLE') {
          // Try to create a minimal table and retry once
          let createTable = `CREATE TABLE IF NOT EXISTS DocsHaveSchedules (
                               sched BIGINT,
                               doctor VARCHAR(255)
                             )`;
          console.log('Creating DocsHaveSchedules table:', createTable);
          con.query(createTable, function(ctErr){
            if (ctErr) {
              console.error('Failed to create DocsHaveSchedules table:', ctErr);
              return;
            }
            // retry insert
            con.query(scheduleInsert, function(retryErr){
              if (retryErr) {
                console.error('Retry insert into DocsHaveSchedules failed:', retryErr);
              } else {
                console.log('Inserted into DocsHaveSchedules after creating table');
              }
            });
          });
        } else {
          // Other insert error: log and continue
          console.warn('DocsHaveSchedules insert failed (non-table error):', err);
        }
      });
    };
  });
});

//Checks if patient is logged in
app.get('/checklogin', (req, res) => {
  let params = req.query;
  if (!params.email || !params.password) {
    return res.status(400).json({ 
      error: 'Missing required parameters'
    });
  }
  let email = params.email;
  let password = params.password;
  let sql_statement = `SELECT * FROM Patient 
                       WHERE email="${email}" 
                       AND password="${password}"`;
  console.log(sql_statement);
  con.query(sql_statement, function (error, results, fields) {
    if (error) {
      console.log("error");
      return res.status(500).json({ failed: 'error ocurred' })
    }
    else {
      if (results.length === 0) {
      } else {
        var string = JSON.stringify(results);
        var json = JSON.parse(string);
        email_in_use = email;
        password_in_use = password;
        who = "pat";
      }
      return res.json({
        data: results
      })
    };
  });
});

//Checks if doctor is logged in
app.get('/checkDoclogin', (req, res) => {
  let params = req.query;
  let email = params.email;
  let password = params.password;
  let sql_statement = `SELECT * 
                       FROM Doctor
                       WHERE email="${email}" AND password="${password}"`;
  console.log(sql_statement);
  con.query(sql_statement, function (error, results, fields) {
    if (error) {
      console.log("eror");
      return res.status(500).json({ failed: 'error ocurred' })
    }
    else {
      if (results.length === 0) {
      } else {
        var string = JSON.stringify(results);
        var json = JSON.parse(string);
        email_in_use = json[0].email;
        password_in_use = json[0].password;
        who="doc";
        console.log(email_in_use);
        console.log(password_in_use);
      }
      return res.json({
        data: results
      })
    };
  });
});

//Resets Patient Password
app.post('/resetPasswordPatient', (req, res) => {
  let something = req.query;
  let email = something.email;
  let oldPassword = "" + something.oldPassword;
  let newPassword = "" + something.newPassword;
  let statement = `UPDATE Patient 
                   SET password = "${newPassword}" 
                   WHERE email = "${email}" 
                   AND password = "${oldPassword}";`;
  console.log(statement);
  con.query(statement, function (error, results, fields) {
    if (error) throw error;
    else {
      return res.json({
        data: results
      })
    };
  });
});

//Resets Doctor Password
app.post('/resetPasswordDoctor', (req, res) => {
  let something = req.query;
  let email = something.email;
  let oldPassword = "" + something.oldPassword;
  let newPassword = "" + something.newPassword;
  let statement = `UPDATE Doctor
                   SET password = "${newPassword}" 
                   WHERE email = "${email}" 
                   AND password = "${oldPassword}";`;
  console.log(statement);
  con.query(statement, function (error, results, fields) {
    if (error) throw error;
    else {
      return res.json({
        data: results
      })
    };
  });
});

//Returns Who is Logged in
app.get('/userInSession', (req, res) => {
  return res.json({ email: `${email_in_use}`, who:`${who}`});
});

//Logs the person out
app.get('/endSession', (req, res) => {
  console.log("Ending session");
  email_in_use = "";
  password_in_use = "";
});

//Appointment Related

//to get all doctor names
app.get('/docInfo', (req, res) => {
  let statement = 'SELECT * FROM Doctor';
  console.log(statement);
  con.query(statement, function (error, results, fields) {
    if (error) {
      console.error('Error fetching doctors:', error);
      return res.status(500).json({ error: 'Database error' });
    }
    else {
      return res.json({
        data: results
      })
    };
  });
});

//Schedules Appointment - SIMPLE VERSION WITHOUT TRIGGERS
app.get('/schedule', (req, res) => {
  let params = req.query;
  let time = params.time;
  let date = params.date;
  let id = params.id;
  let endtime = params.endTime;
  let concerns = params.concerns || '';
  let symptoms = params.symptoms || '';
  let doctor = params.doc;
  
  // Format date properly
  let jsDate = new Date(date);
  let formattedDate = jsDate.toISOString().split('T')[0];
  
  let sql_try = `INSERT INTO Appointment (id, date, starttime, endtime, status) 
                 VALUES (${id}, '${formattedDate}', '${time}', '${endtime}', 'NotDone')`;
  console.log('Scheduling appointment:', sql_try);
  
  con.query(sql_try, function (error, results, fields) {
    if (error) {
      console.error('Error scheduling appointment:', error);
      return res.status(500).json({ error: 'Failed to schedule appointment', details: error.message });
    }
    
    let diagnosisQuery = `INSERT INTO Diagnose (appt, doctor, diagnosis, prescription) 
                         VALUES (${id}, '${doctor}', 'Not Yet Diagnosed', 'Not Yet Diagnosed')`;
    console.log('Creating diagnosis:', diagnosisQuery);
    
    con.query(diagnosisQuery, function (error, results, fields) {
      if (error) {
        console.error('Error creating diagnosis:', error);
        return res.status(500).json({ error: 'Failed to create diagnosis', details: error.message });
      }
      
      return res.json({
        data: results,
        success: true
      });
    });
  });
});

//Checks If a similar appointment exists - SIMPLIFIED TO AVOID CONFLICTS
app.get('/checkIfApptExists', (req, res) => {
  let params = req.query;
  let email = params.email;
  let doc_email = params.docEmail;
  let startTime = params.startTime;
  let date = params.date;
  
  // Format date properly
  let jsDate = new Date(date);
  let formattedDate = jsDate.toISOString().split('T')[0];
  
  console.log('Checking conflicts for:', { email, doc_email, startTime, date: formattedDate });
  
  // Simple conflict check - just check if doctor has appointment at same time
  let statement = `SELECT * FROM Appointment a 
                   INNER JOIN Diagnose d ON a.id = d.appt
                   WHERE d.doctor = '${doc_email}' 
                   AND a.date = '${formattedDate}' 
                   AND a.starttime = '${startTime}'`;
  
  console.log('Conflict check query:', statement);
  
  con.query(statement, function (error, results, fields) {
    if (error) {
      console.error('Database error:', error);
      return res.status(500).json({ error: 'Database error', details: error.message });
    }
    
    console.log('Conflict check results:', results);
    return res.json({
      data: results // Return empty array if no conflicts, populated array if conflicts exist
    });
  });
});

//To show appointments to doctor - ORIGINAL
app.get('/doctorViewAppt', (req, res) => {
  let a = req.query;
  let email = a.email;
  let statement = `SELECT a.id,a.date, a.starttime, a.status, p.name, psa.concerns, psa.symptoms
  FROM Appointment a, PatientsAttendAppointments psa, Patient p
  WHERE a.id = psa.appt AND psa.patient = p.email
  AND a.id IN (SELECT appt FROM Diagnose WHERE doctor="${email_in_use}")`;
  console.log(statement);
  con.query(statement, function (error, results, fields) {
    if (error) throw error;
    else {
      return res.json({
        data: results
      })
    };
  });
});

// Simple doctor schedule endpoint - no stored procedures
app.get('/getDoctorSchedule', (req, res) => {
  let params = req.query;
  let date = params.date;
  
  if (who !== 'doc') {
    return res.status(403).json({ error: 'Access denied' });
  }
  
  let statement = `SELECT a.starttime, a.endtime, p.name as patient_name, 
         a.status, psa.concerns, psa.symptoms
  FROM Appointment a
  INNER JOIN Diagnose d ON a.id = d.appt
  INNER JOIN PatientsAttendAppointments psa ON a.id = psa.appt
  INNER JOIN Patient p ON psa.patient = p.email
  WHERE d.doctor = "${email_in_use}"
  AND a.date = "${date}"
  ORDER BY a.starttime`;
  
  console.log(statement);
  con.query(statement, function (error, results, fields) {
    if (error) {
      console.error('Error fetching schedule:', error);
      return res.status(500).json({ error: 'Database error' });
    }
    res.json({ data: results || [] });
  });
});

//Generates ID for appointment
app.get('/genApptUID', (req, res) => {
  let statement = 'SELECT id FROM Appointment ORDER BY id DESC LIMIT 1;'
  con.query(statement, function (error, results, fields) {
    if (error) {
      console.error('Error generating appointment ID:', error);
      return res.status(500).json({ error: 'Database error' });
    }
    
    // If no appointments exist yet, start with ID 1
    let generated_id = results && results[0] ? results[0].id + 1 : 1;
    
    return res.json({ 
      id: generated_id,
      success: true 
    });
  });
});

//Adds to PatientsAttendAppointment Table
app.get('/addToPatientSeeAppt', (req, res) => {
  let params = req.query;
  let email = params.email;
  let appt_id = params.id;
  let concerns = params.concerns || '';
  let symptoms = params.symptoms || '';
  
  // Escape single quotes in concerns and symptoms to prevent SQL errors
  concerns = concerns.replace(/'/g, "''");
  symptoms = symptoms.replace(/'/g, "''");
  
  let sql_try = `INSERT INTO PatientsAttendAppointments (patient, appt, concerns, symptoms) 
                 VALUES ('${email}', ${appt_id}, '${concerns}', '${symptoms}')`;
  console.log('Adding patient to appointment:', sql_try);
  
  con.query(sql_try, function (error, results, fields) {
    if (error) {
      console.error('Error adding patient appointment:', error);
      return res.status(500).json({ error: 'Failed to add patient appointment', details: error.message });
    }
    else{
      console.log('Patient added to appointment successfully');
      return res.json({
        data: results,
        success: true
      })
    }
  });
});

//Returns Date/Time of Appointment
app.get('/getDateTimeOfAppt', (req, res) => {
  let tmp = req.query;
  let id = tmp.id;
  let statement = `SELECT starttime as start, 
                          endtime as end, 
                          date as theDate 
                   FROM Appointment 
                   WHERE id = "${id}"`;
  console.log(statement);
  con.query(statement, function (error, results, fields) {
    if (error) throw error;
    else {
      console.log(JSON.stringify(results));
      return res.json({
        data: results
      })
    };
  });
});

//To return a particular patient history
app.get('/OneHistory', (req, res) => {
  let params = req.query;
  let email = params.patientEmail;
  let statement = `SELECT gender,name,email,address,conditions,surgeries,medication
                    FROM PatientsFillHistory,Patient,MedicalHistory
                    WHERE PatientsFillHistory.history=id
                    AND patient=email AND email = ` + email;
  console.log(statement);
  con.query(statement, function (error, results, fields) {
    if (error) throw error;
    else {
      return res.json({
        data: results
      })
    }
  })
});

//To show all patients whose medical history can be accessed
app.get('/MedHistView', (req, res) => {
  let params = req.query;
  let patientName = "'%" + params.name + "%'";
  let secondParamTest = "" + params.variable;
  let statement = `SELECT name AS 'Name',
                    PatientsFillHistory.history AS 'ID',
                    email FROM Patient,PatientsFillHistory
                    WHERE Patient.email = PatientsFillHistory.patient
                    AND Patient.email IN (SELECT patient from PatientsAttendAppointments 
                    NATURAL JOIN Diagnose WHERE doctor="${email_in_use}")`;
  if (patientName != "''")
    statement += " AND Patient.name LIKE " + patientName
  console.log(statement)
  con.query(statement, function (error, results, fields) {
    if (error) throw error;
    else {
      return res.json({
        data: results
      })
    };
  });
});

//Returns Appointment Info To patient logged In
app.get('/patientViewAppt', (req, res) => {
  let tmp = req.query;
  let email = tmp.email;
  let statement = `SELECT PatientsAttendAppointments.appt as ID,
                  PatientsAttendAppointments.patient as user, 
                  PatientsAttendAppointments.concerns as theConcerns, 
                  PatientsAttendAppointments.symptoms as theSymptoms, 
                  Appointment.date as theDate,
                  Appointment.starttime as theStart,
                  Appointment.endtime as theEnd,
                  Appointment.status as status
                  FROM PatientsAttendAppointments, Appointment
                  WHERE PatientsAttendAppointments.patient = "${email}" AND
                  PatientsAttendAppointments.appt = Appointment.id`;
  console.log(statement);
  con.query(statement, function (error, results, fields) {
    if (error) throw error;
    else {
      return res.json({
        data: results
      })
    };
  });
});

//Checks if history exists
app.get('/checkIfHistory', (req, res) => {
    let params = req.query;
    let email = params.email;
    let statement = "SELECT patient FROM PatientsFillHistory WHERE patient = " + email;
    console.log(statement)
    con.query(statement, function (error, results, fields) {
        if (error) throw error;
        else {
            return res.json({
                data: results
            })
        };
    });
});

//To fill diagnoses
app.get('/diagnose', (req, res) => {
  let params = req.query;
  let id = params.id;
  let diagnosis = params.diagnosis;
  let prescription = params.prescription;
  let statement = `UPDATE Diagnose SET diagnosis="${diagnosis}", prescription="${prescription}" WHERE appt=${id};`;
  console.log(statement)
  con.query(statement, function (error, results, fields) {
    if (error) throw error;
    else {
      let statement = `UPDATE Appointment SET status="Done" WHERE id=${id};`;
      console.log(statement)
      con.query(statement, function (error, results, fields){
        if (error) throw error;
      })
    };
  });
});

//To show diagnoses
app.get('/showDiagnoses', (req, res) => {
  let id = req.query.id;
  let statement = `SELECT * FROM Diagnose WHERE appt=${id}`;
  console.log(statement);
  con.query(statement, function (error, results, fields) {
    if (error) throw error;
    else {
      return res.json({
        data: results
      })
    };
  });
});

//To Show all diagnosed appointments till now
app.get('/allDiagnoses', (req, res) => {
  let params = req.query;
  let email = params.patientEmail;
  let statement =`SELECT date,doctor,concerns,symptoms,diagnosis,prescription FROM 
  Appointment A INNER JOIN (SELECT * from PatientsAttendAppointments NATURAL JOIN Diagnose 
  WHERE patient=${email}) AS B ON A.id = B.appt;`
  console.log(statement);
  con.query(statement, function (error, results, fields) {
    if (error) throw error;
    else {
      return res.json({
        data: results
      })
    };
  });
});

//To delete appointment
app.get('/deleteAppt', (req, res) => {
  let a = req.query;
  let uid = a.uid;
  let statement = `SELECT status FROM Appointment WHERE id=${uid};`;
  console.log(statement);
  con.query(statement, function (error, results, fields) {
    if (error) throw error;
    else {
      results = results[0].status
      if(results == "NotDone"){
        statement = `DELETE FROM Appointment WHERE id=${uid};`;
        console.log(statement);
        con.query(statement, function (error, results, fields) {
          if (error) throw error;
        });
      }
      else{
        if(who=="pat"){
          statement = `DELETE FROM PatientsAttendAppointments p WHERE p.appt = ${uid}`;
          console.log(statement);
          con.query(statement, function (error, results, fields) {
            if (error) throw error;
          });
        }
      }
    };
  });
  return;
});

//404 catch-all
app.use(function(req, res, next) {
  next(createError(404));
});

//Error handler
app.use(function(err, req, res, next) {
  // Set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};

  // Render the error page
  res.status(err.status || 500);
  res.json({ 
    error: {
      message: err.message,
      status: err.status
    } 
  });
});

app.listen(port, () => {
  console.log(`Server running on http://localhost:${port}`);
});

module.exports = app;