CREATE TABLE organizations ( 
  id int auto_increment primary key,
  org_name varchar(255) not null,
  created_at timestamp default current_timestamp,
  updated_at timestamp default current_timestamp
);

CREATE TABLE organization_parents ( 
  id int auto_increment primary key,
  org_id int(11), 
  parent_id int(11) null,
  created_at timestamp default current_timestamp,
  updated_at timestamp default current_timestamp
);