INSERT INTO times (
times_id,
task_id,
person_uid,
status,
started_at,
finished_at,
time	
) VALUES (

uuid_generate_v4(),
'f65d3827-f746-4e98-b819-013ae7a39adb',
'695011ef-e3fc-48b0-bacb-c5a33e31b4f9',
TRUE,
12,
13,
1
);


// get the last times

SELECT task_name, status, started_at, finished_at, time FROM users,tasks, times WHERE refresh_token = 'xxx';