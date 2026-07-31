
CREATE TABLE users (
	id SERIAL NOT NULL, 
	hashed_password VARCHAR, 
	email VARCHAR, 
	display_name VARCHAR, 
	avatar VARCHAR, 
	created_at TIMESTAMP WITHOUT TIME ZONE, 
	last_login TIMESTAMP WITHOUT TIME ZONE, 
	plan VARCHAR, 
	selected_theme VARCHAR, 
	editor_settings JSON, 
	keyboard_shortcuts JSON, 
	preferences JSON, 
	PRIMARY KEY (id)
)

;


CREATE TABLE analytics (
	id SERIAL NOT NULL, 
	user_id INTEGER, 
	action VARCHAR, 
	model_used VARCHAR, 
	latency_ms INTEGER, 
	credits_used INTEGER, 
	input_tokens INTEGER, 
	output_tokens INTEGER, 
	provider VARCHAR, 
	conversation_id INTEGER, 
	error VARCHAR, 
	created_at TIMESTAMP WITHOUT TIME ZONE, 
	PRIMARY KEY (id), 
	FOREIGN KEY(user_id) REFERENCES users (id) ON DELETE SET NULL
)

;


CREATE TABLE refresh_tokens (
	id SERIAL NOT NULL, 
	user_id INTEGER, 
	token VARCHAR, 
	expires_at TIMESTAMP WITHOUT TIME ZONE, 
	created_at TIMESTAMP WITHOUT TIME ZONE, 
	PRIMARY KEY (id), 
	FOREIGN KEY(user_id) REFERENCES users (id) ON DELETE CASCADE
)

;


CREATE TABLE workspaces (
	id SERIAL NOT NULL, 
	user_id INTEGER, 
	name VARCHAR, 
	path VARCHAR, 
	recent_files JSON, 
	recent_chats JSON, 
	opened_tabs JSON, 
	window_layout JSON, 
	terminal_state JSON, 
	explorer_state JSON, 
	created_at TIMESTAMP WITHOUT TIME ZONE, 
	PRIMARY KEY (id), 
	FOREIGN KEY(user_id) REFERENCES users (id) ON DELETE CASCADE
)

;


CREATE TABLE projects (
	id SERIAL NOT NULL, 
	workspace_id INTEGER, 
	name VARCHAR, 
	path VARCHAR, 
	last_opened TIMESTAMP WITHOUT TIME ZONE, 
	git_branch VARCHAR, 
	project_settings JSON, 
	embeddings_namespace VARCHAR, 
	created_at TIMESTAMP WITHOUT TIME ZONE, 
	updated_at TIMESTAMP WITHOUT TIME ZONE, 
	PRIMARY KEY (id), 
	FOREIGN KEY(workspace_id) REFERENCES workspaces (id) ON DELETE CASCADE, 
	UNIQUE (embeddings_namespace)
)

;


CREATE TABLE conversations (
	id SERIAL NOT NULL, 
	project_id INTEGER, 
	title VARCHAR, 
	current_agent VARCHAR, 
	summary VARCHAR, 
	created_at TIMESTAMP WITHOUT TIME ZONE, 
	updated_at TIMESTAMP WITHOUT TIME ZONE, 
	PRIMARY KEY (id), 
	FOREIGN KEY(project_id) REFERENCES projects (id) ON DELETE CASCADE
)

;


CREATE TABLE indexed_files (
	id SERIAL NOT NULL, 
	project_id INTEGER NOT NULL, 
	file_path VARCHAR NOT NULL, 
	file_hash VARCHAR NOT NULL, 
	chunk_count INTEGER, 
	embedding_version VARCHAR, 
	indexed_at TIMESTAMP WITHOUT TIME ZONE, 
	PRIMARY KEY (id), 
	FOREIGN KEY(project_id) REFERENCES projects (id) ON DELETE CASCADE
)

;


CREATE TABLE messages (
	id SERIAL NOT NULL, 
	conversation_id INTEGER, 
	role VARCHAR, 
	content TEXT, 
	is_pinned BOOLEAN, 
	created_at TIMESTAMP WITHOUT TIME ZONE, 
	PRIMARY KEY (id), 
	FOREIGN KEY(conversation_id) REFERENCES conversations (id) ON DELETE CASCADE
)

;

