
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
DROP EXTENSION pgcrypto;

CREATE TABLE users(
	person_uid UUID NOT NULL PRIMARY KEY,
    user_name VARCHAR(50) NOT NULL UNIQUE,
    email VARCHAR(100) NOT NULL UNIQUE, 
    password VARCHAR(72) NOT NULL
) ;

INSERT INTO users(person_uid, user_name, email, password)
    VALUES (uuid_generate_v4(), 'joe', 'joe@gmail.com', 'joespassword')
,
            (uuid_generate_v4(), 'ryan', 'ryan@gmail.com', 'joespassword')
 ;

/*
SELECT person_uid 
  FROM users
 WHERE email = 'joe@gmail.com' 
   AND password = crypt('joespassword', password)

*/


/**
SELECT SUM(time) as total_time FROM times LEFT JOIN tasks ON tasks.person_uid = '061a6964-54bd-4f73-8c59-3c2e349a0fb9' WHERE tasks.task_name = 'Estudiar' AND EXTRACT(MONTH FROM (TO_TIMESTAMP(finished_at / 1000))) = 4; */

/*
SELECT time, EXTRACT(DAY FROM TO_TIMESTAMP(finished_at / 1000)) AS day_number, 
DATE_PART('days', 
DATE_TRUNC('month', TO_TIMESTAMP(finished_at / 1000)) 
+ '1 MONTH'::INTERVAL 
- '1 DAY'::INTERVAL
) AS total_days FROM times LEFT JOIN tasks 
ON tasks.person_uid = $1
WHERE tasks.task_name = $2
AND EXTRACT(MONTH FROM (TO_TIMESTAMP(finished_at / 1000))) = $3
AND EXTRACT(YEAR FROM (TO_TIMESTAMP(finished_at / 1000))) = $4
*/