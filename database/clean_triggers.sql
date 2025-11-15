-- Clean up all triggers, procedures and functions
DROP TRIGGER IF EXISTS appointment_status_audit;
DROP TRIGGER IF EXISTS prevent_double_booking;
DROP TRIGGER IF EXISTS validate_appointment_time;

DROP PROCEDURE IF EXISTS schedule_appointment;
DROP PROCEDURE IF EXISTS get_doctor_schedule;
DROP PROCEDURE IF EXISTS get_patient_history;

DROP FUNCTION IF EXISTS is_slot_available;
DROP FUNCTION IF EXISTS get_next_available_slot;

-- Optionally drop audit table if not needed
-- DROP TABLE IF EXISTS AppointmentAudit;

-- Show what's left
SHOW TRIGGERS;
SHOW PROCEDURE STATUS WHERE Db = 'HMS';
SHOW FUNCTION STATUS WHERE Db = 'HMS';
