/*
* Appointment Audit Table
* Tracks all changes made to appointment statuses
* Stores who made the change and when
*/
CREATE TABLE AppointmentAudit (
    audit_id INT AUTO_INCREMENT PRIMARY KEY,
    appointment_id INT,
    action_type VARCHAR(20),
    action_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    user_email VARCHAR(50),
    old_status VARCHAR(15),
    new_status VARCHAR(15)
);

/*
* Trigger: appointment_status_audit
* Fires: AFTER UPDATE on Appointment table
* Purpose: Tracks changes in appointment status (e.g. NotDone -> Done)
* Stores: Old and new status, who made the change, when it was made
*/
DELIMITER //
CREATE TRIGGER appointment_status_audit
AFTER UPDATE ON Appointment
FOR EACH ROW
BEGIN
    -- Only log if status actually changed
    IF OLD.status != NEW.status THEN
        INSERT INTO AppointmentAudit(appointment_id, action_type, user_email, old_status, new_status)
        VALUES (NEW.id, 'STATUS_CHANGE', @user_email, OLD.status, NEW.status);
    END IF;
END;//

/*
* Trigger: validate_appointment_time
* Fires: BEFORE INSERT on Appointment table
* Purpose: Ensures appointments are within working hours (9 AM - 5 PM)
* Checks: If appointment start time is within allowed range
* Throws: Error if time is outside working hours
*/
CREATE TRIGGER validate_appointment_time
BEFORE INSERT ON Appointment
FOR EACH ROW
BEGIN
    -- Check if time is within working hours
    IF TIME(NEW.starttime) NOT BETWEEN '09:00:00' AND '17:00:00' THEN
        SIGNAL SQLSTATE '45000'
        SET MESSAGE_TEXT = 'Appointments must be between 9 AM and 5 PM';
    END IF;
END;//

DELIMITER ;

-- Disable problematic triggers for now
DROP TRIGGER IF EXISTS prevent_double_booking;
DROP TRIGGER IF EXISTS validate_appointment_time;
DROP TRIGGER IF EXISTS appointment_status_audit;
