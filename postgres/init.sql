CREATE TABLE urls (
    short_code VARCHAR(8) PRIMARY KEY,
    long_url TEXT NOT NULL,
    user_id UUID,
    title VARCHAR(255),
    expires_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    is_active BOOLEAN DEFAULT TRUE

);

CREATE INDEX idx_urls_user ON urls(user_id);
CREATE INDEX idx_urls_expirty ON urls(expires_at) WHERE expires_at IS NOT NULL;



CREATE TABLE click_analytics (
    short_code VARCHAR(8) PRIMARY KEY REFERENCES urls(short_code) ,
    total_clicks BIGINT DEFAULT 0,
    country_data JSONB DEFAULT '{}',
    device_data JSONB DEFAULT '{}',
    updated_at TIMESTAMPTZ DEFAULT NOW()
      
);


CREATE TABLE click_log (
  id            BIGSERIAL       PRIMARY KEY,
  short_code    VARCHAR(8)      NOT NULL,
  country       CHAR(2),
  city          VARCHAR(100),
  device        VARCHAR(20),
  clicked_at    TIMESTAMPTZ     DEFAULT NOW()
);


CREATE INDEX idx_clicks_code ON click_log(short_code, clicked_at DESC);
CREATE INDEX idx_clicks_time ON click_log(clicked_at);

CREATE TABLE users (
  id            UUID            PRIMARY KEY DEFAULT gen_random_uuid(),
  email         VARCHAR(255)    UNIQUE NOT NULL,
  password_hash VARCHAR(255)    NOT NULL,
  short_codes   VARCHAR(8)[]    DEFAULT '{}',   
  created_at    TIMESTAMPTZ     DEFAULT NOW(),
  plan          VARCHAR(20)     DEFAULT 'free'  
);
