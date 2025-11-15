DELIMITER //

/*
* Procedure: schedule_appointment
* Purpose: Handles complete appointment scheduling process
* Parameters:
*   - p_date: Appointment date
*   - p_starttime: Start time
*   - p_endtime: End time
*   - p_doctor: Doctor's email
*   - p_patient: Patient's email
*   - p_concerns: Patient's concerns
*   - p_symptoms: Patient's symptoms
* Actions:
*   1. Starts transaction for data consistency
*   2. Checks for conflicts
*   3. Generates unique appointment ID
*   4. Creates appointment record
*   5. Links appointment to patient
*   6. Creates initial diagnosis record
* Error Handling: Rolls back on any error
*/
CREATE PROCEDURE schedule_appointment(
    IN p_date DATE,
    IN p_starttime TIME,
    IN p_endtime TIME,
    IN p_doctor VARCHAR(50),
    IN p_patient VARCHAR(50),
    IN p_concerns VARCHAR(40),
    IN p_symptoms VARCHAR(40)
)
BEGIN
    DECLARE appt_id INT;
    DECLARE conflict_count INT DEFAULT 0;
    DECLARE EXIT HANDLER FOR SQLEXCEPTION
    BEGIN
        ROLLBACK;
        RESIGNAL;
    END;
    
    START TRANSACTION;
    
    -- Check for existing appointments at same time for same doctor
    SELECT COUNT(*) INTO conflict_count
    FROM Appointment a
    INNER JOIN Diagnose d ON a.id = d.appt
    WHERE d.doctor = p_doctor
    AND a.date = p_date
    AND a.starttime = p_starttime;
    
    -- If conflict exists, signal error
    IF conflict_count > 0 THEN
        SIGNAL SQLSTATE '45000'
        SET MESSAGE_TEXT = 'Doctor already has appointment at this time';
    END IF;
    
    -- Generate new appointment ID
    SELECT COALESCE(MAX(id), 0) + 1 INTO appt_id FROM Appointment;
    
    -- Create appointment
    INSERT INTO Appointment(id, date, starttime, endtime, status)
    VALUES (appt_id, p_date, p_starttime, p_endtime, 'NotDone');
    
    -- Link appointment to patient
    INSERT INTO PatientsAttendAppointments(patient, appt, concerns, symptoms)
    VALUES (p_patient, appt_id, p_concerns, p_symptoms);
    
    -- Create diagnosis record
    INSERT INTO Diagnose(appt, doctor, diagnosis, prescription)
    VALUES (appt_id, p_doctor, 'Not Yet Diagnosed', 'Not Yet Diagnosed');
    
    COMMIT;
    
    SELECT appt_id AS appointment_id;
END//

/*
* Procedure: get_doctor_schedule
* Purpose: Retrieves doctor's complete schedule for a day
* Parameters:
*   - p_doctor_email: Doctor's email
*   - p_date: Date to check
* Returns: All appointments with patient details
* Used by: Doctor's dashboard
* Includes:
*   - Appointment times
*   - Patient names
*   - Appointment status
*   - Patient concerns/symptoms
*/
CREATE PROCEDURE get_doctor_schedule(
    IN p_doctor_email VARCHAR(50),
    IN p_date DATE
)
BEGIN
    SELECT a.starttime, a.endtime, p.name as patient_name, 
           a.status, psa.concerns, psa.symptoms
    FROM Appointment a
    INNER JOIN Diagnose d ON a.id = d.appt
    INNER JOIN PatientsAttendAppointments psa ON a.id = psa.appt
    INNER JOIN Patient p ON psa.patient = p.email
    WHERE d.doctor = p_doctor_email
    AND a.date = p_date
    ORDER BY a.starttime;
END//

/*
* Procedure: get_patient_history
* Purpose: Retrieves complete medical history for a patient
* Parameters:
*   - p_patient_email: Patient's email
* Returns: 
*   - Medical history records
*   - Past appointments
*   - Diagnoses
*   - Prescriptions
*   - Treating doctors
* Used by: 
*   - Patient history view
*   - Doctor's patient review
* Orders: Most recent first
*/
CREATE PROCEDURE get_patient_history(
    IN p_patient_email VARCHAR(50)
)
BEGIN
    SELECT m.*, a.date as appt_date, d.diagnosis, d.prescription,
           doc.name as doctor_name
    FROM MedicalHistory m
    INNER JOIN PatientsFillHistory pfh ON m.id = pfh.history
    LEFT JOIN PatientsAttendAppointments psa ON pfh.patient = psa.patient
    LEFT JOIN Appointment a ON psa.appt = a.id
    LEFT JOIN Diagnose d ON a.id = d.appt
    LEFT JOIN Doctor doc ON d.doctor = doc.email
    WHERE pfh.patient = p_patient_email
    ORDER BY a.date DESC;
END//

DELIMITER ;
