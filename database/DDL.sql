CREATE DATABASE HMS;
USE HMS;

CREATE TABLE Patient(
email varchar(50) PRIMARY KEY,
password varchar(30) NOT NULL,
name varchar(50) NOT NULL,
address varchar(60) NOT NULL,
gender VARCHAR(20) NOT NULL
);

CREATE TABLE MedicalHistory(
id int PRIMARY KEY,
date DATE NOT NULL,
conditions VARCHAR(100) NOT NULL, 
surgeries VARCHAR(100) NOT NULL, 
medication VARCHAR(100) NOT NULL
);

CREATE TABLE Doctor(
email varchar(50) PRIMARY KEY,
gender varchar(20) NOT NULL,
password varchar(30) NOT NULL,
name varchar(50) NOT NULL
);

CREATE TABLE Appointment(
id int PRIMARY KEY,
date DATE NOT NULL,
starttime TIME NOT NULL,
endtime TIME NOT NULL,
status varchar(15) NOT NULL
);

CREATE TABLE PatientsAttendAppointments(
patient varchar(50) NOT NULL,
appt int NOT NULL,
concerns varchar(40) NOT NULL,
symptoms varchar(40) NOT NULL,
FOREIGN KEY (patient) REFERENCES Patient (email) ON DELETE CASCADE,
FOREIGN KEY (appt) REFERENCES Appointment (id) ON DELETE CASCADE,
PRIMARY KEY (patient, appt)
);


CREATE TABLE Schedule(
    id BIGINT UNSIGNED PRIMARY KEY,
    day varchar(20) NOT NULL,
    starttime TIME NOT NULL,
    endtime TIME NOT NULL,
    breaktime TIME NOT NULL,
    CONSTRAINT chk_day CHECK (day IN ('Monday','Tuesday','Wednesday','Thursday','Friday','Saturday','Sunday')),
    CONSTRAINT chk_times CHECK (starttime < endtime AND breaktime BETWEEN starttime AND endtime)
);

-- Clear and reinsert schedule with correct IDs 
INSERT INTO Schedule (id, day, starttime, endtime, breaktime) VALUES 
(1, 'Monday', '09:00', '17:00', '13:00'),
(2, 'Tuesday', '09:00', '17:00', '13:00'),
(3, 'Wednesday', '09:00', '17:00', '13:00'),
(4, 'Thursday', '09:00', '17:00', '13:00'),
(5, 'Friday', '09:00', '17:00', '13:00'),
(6, 'Saturday', '09:00', '17:00', '13:00'),
(7, 'Sunday', '09:00', '17:00', '13:00');

-- Update DocsHaveSchedules to match new schedule IDs
CREATE TABLE DocsHaveSchedules(
    sched BIGINT UNSIGNED,
    doctor varchar(50) NOT NULL,
    FOREIGN KEY (sched) REFERENCES Schedule(id) ON DELETE CASCADE,
    FOREIGN KEY (doctor) REFERENCES Doctor(email) ON DELETE CASCADE,
    PRIMARY KEY (sched, doctor)
);

-- Insert default schedule
INSERT INTO Schedule (id, day, starttime, endtime, breaktime) VALUES 
(8877660099, 'Monday', '09:00:00', '17:00:00', '13:00:00'),
(8877660099, 'Tuesday', '09:00:00', '17:00:00', '13:00:00'),
(8877660099, 'Wednesday', '09:00:00', '17:00:00', '13:00:00'),
(8877660099, 'Thursday', '09:00:00', '17:00:00', '13:00:00'),
(8877660099, 'Friday', '09:00:00', '17:00:00', '13:00:00');

CREATE TABLE PatientsFillHistory(
patient varchar(50) NOT NULL,
history int NOT NULL,
FOREIGN KEY (patient) REFERENCES Patient (email) ON DELETE CASCADE,
FOREIGN KEY (history) REFERENCES MedicalHistory (id) ON DELETE CASCADE,
PRIMARY KEY (history)
);

CREATE TABLE Diagnose(
appt int NOT NULL,
doctor varchar(50) NOT NULL,
diagnosis varchar(40) NOT NULL,
prescription varchar(50) NOT NULL,
FOREIGN KEY (appt) REFERENCES Appointment (id) ON DELETE CASCADE,
FOREIGN KEY (doctor) REFERENCES Doctor (email) ON DELETE CASCADE,
PRIMARY KEY (appt, doctor)
);

CREATE TABLE DoctorViewsHistory(
history int NOT NULL,
doctor varchar(50) NOT NULL,
FOREIGN KEY (doctor) REFERENCES Doctor (email) ON DELETE CASCADE,
FOREIGN KEY (history) REFERENCES MedicalHistory (id) ON DELETE CASCADE,
PRIMARY KEY (history, doctor)
);