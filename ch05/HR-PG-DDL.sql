-- =====================================================================
-- HR_Create_pg.sql
-- Oracle HR 데모 스키마를 PostgreSQL 17 용으로 변환한 스크립트
-- 원본: HR_Create.sql (Oracle)
-- =====================================================================

CREATE SCHEMA IF NOT EXISTS hr;
SET search_path TO hr;


-- ********************************************************************
-- Create the REGIONS table to hold region information for locations
-- HR.LOCATIONS table has a foreign key to this table.


CREATE TABLE regions
    ( region_id      NUMERIC 
       CONSTRAINT  region_id_nn NOT NULL 
    , region_name    VARCHAR(25) 
    );

-- (중복 인덱스 제거됨: PRIMARY KEY 제약조건이 동일 인덱스를 자동 생성함 -- reg_id_pk)
ALTER TABLE regions
  ADD CONSTRAINT reg_id_pk
       		 PRIMARY KEY (region_id);

-- ********************************************************************
-- Create the COUNTRIES table to hold country information for customers
-- and company locations.
-- OE.CUSTOMERS table and HR.LOCATIONS have a foreign key to this table.


CREATE TABLE countries 
    ( country_id      CHAR(2) 
       CONSTRAINT  country_id_nn NOT NULL 
    , country_name    VARCHAR(40) 
    , region_id       NUMERIC 
    , CONSTRAINT     country_c_id_pk 
        	     PRIMARY KEY (country_id) 
    ); 

ALTER TABLE countries
  ADD CONSTRAINT countr_reg_fk
        	 FOREIGN KEY (region_id)
          	  REFERENCES regions(region_id);

-- ********************************************************************
-- Create the LOCATIONS table to hold address information for company departments.
-- HR.DEPARTMENTS has a foreign key to this table.


CREATE TABLE locations
    ( location_id    NUMERIC(4)
    , street_address VARCHAR(40)
    , postal_code    VARCHAR(12)
    , city       VARCHAR(30)
	CONSTRAINT     loc_city_nn  NOT NULL
    , state_province VARCHAR(25)
    , country_id     CHAR(2)
    ) ;

-- (중복 인덱스 제거됨: PRIMARY KEY 제약조건이 동일 인덱스를 자동 생성함 -- loc_id_pk)
ALTER TABLE locations
  ADD CONSTRAINT loc_id_pk
       		 PRIMARY KEY (location_id),
  ADD CONSTRAINT loc_c_id_fk
       		 FOREIGN KEY (country_id)
        	  REFERENCES countries(country_id);

-- Useful for any subsequent addition of rows to locations table
-- Starts with 3300

CREATE SEQUENCE locations_seq
 START WITH     3300
 INCREMENT BY   100
 MAXVALUE       9900

NO CYCLE;

-- ********************************************************************
-- Create the DEPARTMENTS table to hold company department information.
-- HR.EMPLOYEES and HR.JOB_HISTORY have a foreign key to this table.


CREATE TABLE departments
    ( department_id    NUMERIC(4)
    , department_name  VARCHAR(30)
	CONSTRAINT  dept_name_nn  NOT NULL
    , manager_id       NUMERIC(6)
    , location_id      NUMERIC(4)
    ) ;

-- (중복 인덱스 제거됨: PRIMARY KEY 제약조건이 동일 인덱스를 자동 생성함 -- dept_id_pk)
ALTER TABLE departments
  ADD CONSTRAINT dept_id_pk
       		 PRIMARY KEY (department_id),
  ADD CONSTRAINT dept_loc_fk
       		 FOREIGN KEY (location_id)
        	  REFERENCES locations (location_id);

-- Useful for any subsequent addition of rows to departments table
-- Starts with 280

CREATE SEQUENCE departments_seq
 START WITH     280
 INCREMENT BY   10
 MAXVALUE       9990

NO CYCLE;

-- ********************************************************************
-- Create the JOBS table to hold the different names of job roles within the company.
-- HR.EMPLOYEES has a foreign key to this table.


CREATE TABLE jobs
    ( job_id         VARCHAR(10)
    , job_title      VARCHAR(35)
	CONSTRAINT     job_title_nn  NOT NULL
    , min_salary     NUMERIC(6)
    , max_salary     NUMERIC(6)
    ) ;

-- (중복 인덱스 제거됨: PRIMARY KEY 제약조건이 동일 인덱스를 자동 생성함 -- job_id_pk)
ALTER TABLE jobs
  ADD CONSTRAINT job_id_pk
      		 PRIMARY KEY(job_id);

-- ********************************************************************
-- Create the EMPLOYEES table to hold the employee personnel
-- information for the company.
-- HR.EMPLOYEES has a self referencing foreign key to this table.


CREATE TABLE employees
    ( employee_id    NUMERIC(6)
    , first_name     VARCHAR(20)
    , last_name      VARCHAR(25)
	 CONSTRAINT     emp_last_name_nn  NOT NULL
    , email          VARCHAR(25)
	CONSTRAINT     emp_email_nn  NOT NULL
    , phone_number   VARCHAR(20)
    , hire_date      DATE
	CONSTRAINT     emp_hire_date_nn  NOT NULL
    , job_id         VARCHAR(10)
	CONSTRAINT     emp_job_nn  NOT NULL
    , salary         NUMERIC(8,2)
    , commission_pct NUMERIC(2,2)
    , manager_id     NUMERIC(6)
    , department_id  NUMERIC(4)
    , CONSTRAINT     emp_salary_min
                     CHECK (salary > 0) 
    , CONSTRAINT     emp_email_uk
                     UNIQUE (email)
    ) ;

-- (중복 인덱스 제거됨: PRIMARY KEY 제약조건이 동일 인덱스를 자동 생성함 -- emp_emp_id_pk)
ALTER TABLE employees
  ADD CONSTRAINT     emp_emp_id_pk
                     PRIMARY KEY (employee_id),
  ADD CONSTRAINT     emp_dept_fk
                     FOREIGN KEY (department_id)
                      REFERENCES departments,
  ADD CONSTRAINT     emp_job_fk
                     FOREIGN KEY (job_id)
                      REFERENCES jobs (job_id),
  ADD CONSTRAINT     emp_manager_fk
                     FOREIGN KEY (manager_id)
                      REFERENCES employees;

-- dept_mgr_fk 제약조건은 employees 데이터 적재 이후로 지연 생성 (순환 참조 해결, 아래 ENABLE CONSTRAINT 지점 참고)


-- Useful for any subsequent addition of rows to employees table
-- Starts with 207


CREATE SEQUENCE employees_seq
 START WITH     207
 INCREMENT BY   1

NO CYCLE;

-- ********************************************************************
-- Create the JOB_HISTORY table to hold the history of jobs that
-- employees have held in the past.
-- HR.JOBS, HR_DEPARTMENTS, and HR.EMPLOYEES have a foreign key to this table.


CREATE TABLE job_history
    ( employee_id   NUMERIC(6)
	 CONSTRAINT    jhist_employee_nn  NOT NULL
    , start_date    DATE
	CONSTRAINT    jhist_start_date_nn  NOT NULL
    , end_date      DATE
	CONSTRAINT    jhist_end_date_nn  NOT NULL
    , job_id        VARCHAR(10)
	CONSTRAINT    jhist_job_nn  NOT NULL
    , department_id NUMERIC(4)
    , CONSTRAINT    jhist_date_interval
                    CHECK (end_date > start_date)
    ) ;

-- (중복 인덱스 제거됨: PRIMARY KEY 제약조건이 동일 인덱스를 자동 생성함 -- jhist_emp_id_st_date_pk)
ALTER TABLE job_history
  ADD CONSTRAINT jhist_emp_id_st_date_pk
      PRIMARY KEY (employee_id, start_date),
  ADD CONSTRAINT     jhist_job_fk
                     FOREIGN KEY (job_id)
                     REFERENCES jobs,
  ADD CONSTRAINT     jhist_emp_fk
                     FOREIGN KEY (employee_id)
                     REFERENCES employees,
  ADD CONSTRAINT     jhist_dept_fk
                     FOREIGN KEY (department_id)
                     REFERENCES departments;

-- ********************************************************************
-- Create the EMP_DETAILS_VIEW that joins the employees, jobs,
-- departments, jobs, countries, and locations table to provide details
-- about employees.


CREATE OR REPLACE VIEW emp_details_view
  (employee_id,
   job_id,
   manager_id,
   department_id,
   location_id,
   country_id,
   first_name,
   last_name,
   salary,
   commission_pct,
   department_name,
   job_title,
   city,
   state_province,
   country_name,
   region_name)
AS SELECT
  e.employee_id, 
  e.job_id, 
  e.manager_id, 
  e.department_id,
  d.location_id,
  l.country_id,
  e.first_name,
  e.last_name,
  e.salary,
  e.commission_pct,
  d.department_name,
  j.job_title,
  l.city,
  l.state_province,
  c.country_name,
  r.region_name
FROM
  employees e,
  departments d,
  jobs j,
  locations l,
  countries c,
  regions r
WHERE e.department_id = d.department_id
  AND d.location_id = l.location_id
  AND l.country_id = c.country_id
  AND c.region_id = r.region_id
  AND j.job_id = e.job_id;




-- ALTER SESSION SET NLS_LANGUAGE=American; 

-- ***************************insert data into the REGIONS table





-- ***************************insert data into the COUNTRIES table



























-- ***************************insert data into the LOCATIONS table

























-- ****************************insert data into the DEPARTMENTS table

-- disable integrity constraint to EMPLOYEES to load data

-- dept_mgr_fk 제약조건이 아직 생성되지 않았으므로 DISABLE 불필요


                                
                

                
                
                
                

                


















-- ***************************insert data into the JOBS table


















-- ***************************insert data into the EMPLOYEES table












































































































-- ********* insert data into the JOB_HISTORY table












-- enable integrity constraint to DEPARTMENTS

ALTER TABLE departments
  ADD CONSTRAINT dept_mgr_fk
  FOREIGN KEY (manager_id) REFERENCES employees (employee_id);


CREATE INDEX emp_department_ix
       ON employees (department_id);

CREATE INDEX emp_job_ix
       ON employees (job_id);

CREATE INDEX emp_manager_ix
       ON employees (manager_id);

CREATE INDEX emp_name_ix
       ON employees (last_name, first_name);

CREATE INDEX dept_location_ix
       ON departments (location_id);

CREATE INDEX jhist_job_ix
       ON job_history (job_id);

CREATE INDEX jhist_employee_ix
       ON job_history (employee_id);

CREATE INDEX jhist_department_ix
       ON job_history (department_id);

CREATE INDEX loc_city_ix
       ON locations (city);

CREATE INDEX loc_state_province_ix	
       ON locations (state_province);

CREATE INDEX loc_country_ix
       ON locations (country_id);


-- procedure and statement trigger to allow dmls during business hours:
-- (Oracle PROCEDURE/TRIGGER -> PostgreSQL FUNCTION + TRIGGER 로 변환)
CREATE OR REPLACE FUNCTION secure_dml() RETURNS trigger AS $$
BEGIN
  IF TO_CHAR (clock_timestamp(), 'HH24:MI') NOT BETWEEN '08:00' AND '18:00'
        OR TO_CHAR (clock_timestamp(), 'DY') IN ('SAT', 'SUN') THEN
    RAISE EXCEPTION 'You may only make changes during normal office hours';
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER secure_employees
  BEFORE INSERT OR UPDATE OR DELETE ON employees
  FOR EACH STATEMENT
  EXECUTE FUNCTION secure_dml();

ALTER TABLE employees DISABLE TRIGGER secure_employees;

-- **************************************************************************
-- procedure to add a row to the JOB_HISTORY table and row trigger
-- to call the procedure when data is updated in the job_id or
-- department_id columns in the EMPLOYEES table:

CREATE OR REPLACE FUNCTION add_job_history(
     p_emp_id          job_history.employee_id%type
   , p_start_date      job_history.start_date%type
   , p_end_date        job_history.end_date%type
   , p_job_id          job_history.job_id%type
   , p_department_id   job_history.department_id%type
   ) RETURNS void AS $$
BEGIN
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION update_job_history() RETURNS trigger AS $$
BEGIN
  PERFORM add_job_history(OLD.employee_id, OLD.hire_date, CURRENT_DATE,
                  OLD.job_id, OLD.department_id);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_job_history
  AFTER UPDATE OF job_id, department_id ON employees
  FOR EACH ROW
  EXECUTE FUNCTION update_job_history();


COMMENT ON TABLE regions 
IS 'Regions table that contains region numbers and names. Contains 4 rows; references with the Countries table.';

COMMENT ON COLUMN regions.region_id
IS 'Primary key of regions table.';

COMMENT ON COLUMN regions.region_name
IS 'Names of regions. Locations are in the countries of these regions.';

COMMENT ON TABLE locations
IS 'Locations table that contains specific address of a specific office,
warehouse, and/or production site of a company. Does not store addresses /
locations of customers. Contains 23 rows; references with the
departments and countries tables. ';

COMMENT ON COLUMN locations.location_id
IS 'Primary key of locations table';

COMMENT ON COLUMN locations.street_address
IS 'Street address of an office, warehouse, or production site of a company.
Contains building number and street name';

COMMENT ON COLUMN locations.postal_code
IS 'Postal code of the location of an office, warehouse, or production site 
of a company. ';

COMMENT ON COLUMN locations.city
IS 'A not null column that shows city where an office, warehouse, or 
production site of a company is located. ';

COMMENT ON COLUMN locations.state_province
IS 'State or Province where an office, warehouse, or production site of a 
company is located.';

COMMENT ON COLUMN locations.country_id
IS 'Country where an office, warehouse, or production site of a company is
located. Foreign key to country_id column of the countries table.';


-- *********************************************

COMMENT ON TABLE departments
IS 'Departments table that shows details of departments where employees 
work. Contains 27 rows; references with locations, employees, and job_history tables.';

COMMENT ON COLUMN departments.department_id
IS 'Primary key column of departments table.';

COMMENT ON COLUMN departments.department_name
IS 'A not null column that shows name of a department. Administration, 
Marketing, Purchasing, Human Resources, Shipping, IT, Executive, Public 
Relations, Sales, Finance, and Accounting. ';

COMMENT ON COLUMN departments.manager_id
IS 'Manager_id of a department. Foreign key to employee_id column of employees table. The manager_id column of the employee table references this column.';

COMMENT ON COLUMN departments.location_id
IS 'Location id where a department is located. Foreign key to location_id column of locations table.';


-- *********************************************

COMMENT ON TABLE job_history
IS 'Table that stores job history of the employees. If an employee 
changes departments within the job or changes jobs within the department, 
new rows get inserted into this table with old job information of the 
employee. Contains a complex primary key: employee_id+start_date.
Contains 25 rows. References with jobs, employees, and departments tables.';

COMMENT ON COLUMN job_history.employee_id
IS 'A not null column in the complex primary key employee_id+start_date.
Foreign key to employee_id column of the employee table';

COMMENT ON COLUMN job_history.start_date
IS 'A not null column in the complex primary key employee_id+start_date. 
Must be less than the end_date of the job_history table. (enforced by 
constraint jhist_date_interval)';

COMMENT ON COLUMN job_history.end_date
IS 'Last day of the employee in this job role. A not null column. Must be 
greater than the start_date of the job_history table. 
(enforced by constraint jhist_date_interval)';

COMMENT ON COLUMN job_history.job_id
IS 'Job role in which the employee worked in the past; foreign key to 
job_id column in the jobs table. A not null column.';

COMMENT ON COLUMN job_history.department_id
IS 'Department id in which the employee worked in the past; foreign key to deparment_id column in the departments table';


-- *********************************************
 
COMMENT ON TABLE countries
IS 'country table. Contains 25 rows. References with locations table.';

COMMENT ON COLUMN countries.country_id
IS 'Primary key of countries table.';

COMMENT ON COLUMN countries.country_name
IS 'Country name';

COMMENT ON COLUMN countries.region_id
IS 'Region ID for the country. Foreign key to region_id column in the departments table.';

-- *********************************************

COMMENT ON TABLE jobs
IS 'jobs table with job titles and salary ranges. Contains 19 rows.
References with employees and job_history table.';

COMMENT ON COLUMN jobs.job_id
IS 'Primary key of jobs table.';

COMMENT ON COLUMN jobs.job_title
IS 'A not null column that shows job title, e.g. AD_VP, FI_ACCOUNTANT';

COMMENT ON COLUMN jobs.min_salary
IS 'Minimum salary for a job title.';

COMMENT ON COLUMN jobs.max_salary
IS 'Maximum salary for a job title';

-- *********************************************

COMMENT ON TABLE employees
IS 'employees table. Contains 107 rows. References with departments, 
jobs, job_history tables. Contains a self reference.';

COMMENT ON COLUMN employees.employee_id
IS 'Primary key of employees table.';

COMMENT ON COLUMN employees.first_name
IS 'First name of the employee. A not null column.';

COMMENT ON COLUMN employees.last_name
IS 'Last name of the employee. A not null column.';

COMMENT ON COLUMN employees.email
IS 'Email id of the employee';

COMMENT ON COLUMN employees.phone_number
IS 'Phone number of the employee; includes country code and area code';

COMMENT ON COLUMN employees.hire_date
IS 'Date when the employee started on this job. A not null column.';

COMMENT ON COLUMN employees.job_id
IS 'Current job of the employee; foreign key to job_id column of the 
jobs table. A not null column.';

COMMENT ON COLUMN employees.salary
IS 'Monthly salary of the employee. Must be greater 
than zero (enforced by constraint emp_salary_min)';

COMMENT ON COLUMN employees.commission_pct
IS 'Commission percentage of the employee; Only employees in sales 
department elgible for commission percentage';

COMMENT ON COLUMN employees.manager_id
IS 'Manager id of the employee; has same domain as manager_id in 
departments table. Foreign key to employee_id column of employees table.
(useful for reflexive joins and CONNECT BY query)';

COMMENT ON COLUMN employees.department_id
IS 'Department id where employee works; foreign key to department_id 
column of the departments table';

