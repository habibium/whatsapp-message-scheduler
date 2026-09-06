use chrono::{DateTime, Utc};
use serde::{Deserialize, Serialize};
use utoipa::ToSchema;
use uuid::Uuid;
use validator::Validate;

#[derive(Deserialize, Validate, ToSchema)]
pub struct SignupRequest {
    #[validate(email)]
    #[schema(format = "email", example = "user@example.com")]
    email: String,
    #[validate(length(min = 8, max = 128))]
    #[schema(min_length = 8, max_length = 128)]
    password: String,
}

#[derive(Serialize, ToSchema)]
pub(super) struct SignupResponse {
    pub(super) id: Uuid,
    pub(super) email: String,
    pub(super) verified_at: Option<DateTime<Utc>>,
    pub(super) created_at: DateTime<Utc>,
    pub(super) updated_at: DateTime<Utc>,
}
