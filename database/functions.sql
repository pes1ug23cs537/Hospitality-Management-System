DELIMITER //

/*
* Function: is_slot_available
* Purpose: Checks if a specific time slot is available for a doctor
* Parameters:
*   - p_date: The date to check
*   - p_time: The time slot to check
*   - p_doctor: Doctor's email
* Returns: TRUE if slot is available, FALSE if taken
* Used by: Appointment scheduling system
*/
CREATE FUNCTION is_slot_available(
    p_date DATE,
    p_time TIME,
    p_doctor VARCHAR(50)
) RETURNS BOOLEAN
DETERMINISTIC
BEGIN
    DECLARE slot_count INT;
    
    SELECT COUNT(*) INTO slot_count
    FROM Appointment a
    INNER JOIN Diagnose d ON a.id = d.appt
    WHERE d.doctor = p_doctor
    AND a.date = p_date
    AND a.starttime = p_time;
    
    RETURN slot_count = 0;
END//

/*
* Function: get_next_available_slot
* Purpose: Finds the next available appointment slot for a doctor
* Parameters:
*   - p_doctor: Doctor's email
*   - p_start_date: Date to start searching from
* Returns: DATETIME of next available slot
* Logic:
*   1. Looks at doctor's schedule
*   2. Checks next 5 days
*   3. Considers working days only
*   4. Excludes existing appointments
*   5. Returns earliest available slot
* Used by: Smart scheduling system
*/
CREATE FUNCTION get_next_available_slot(
    p_doctor VARCHAR(50),
    p_start_date DATE
) RETURNS DATETIME
DETERMINISTIC
BEGIN
    DECLARE next_slot DATETIME;
    
    SELECT MIN(TIMESTAMP(a.date, a.starttime)) INTO next_slot
    FROM Schedule s
    CROSS JOIN (
        SELECT p_start_date + INTERVAL n DAY as date
        FROM (
            SELECT 0 as n UNION SELECT 1 UNION SELECT 2 
            UNION SELECT 3 UNION SELECT 4 UNION SELECT 5
        ) numbers
    ) dates
    LEFT JOIN Appointment a ON dates.date = a.date
    LEFT JOIN Diagnose d ON a.id = d.appt AND d.doctor = p_doctor
    WHERE d.appt IS NULL
    AND DAYNAME(dates.date) = s.day
    AND EXISTS (
        SELECT 1 FROM DocsHaveSchedules dhs 
        WHERE dhs.doctor = p_doctor AND dhs.sched = s.id
    );
    
    RETURN next_slot;
END//

DELIMITER ;
