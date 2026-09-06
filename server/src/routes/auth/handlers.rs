use axum::{Json, extract::State};

use super::dto::{SignupRequest, SignupResponse};
use crate::{AppState, error::AppError};

/// Sign up
///
/// Sign up a user with email & password
#[utoipa::path(post, path = "/signup", request_body = SignupRequest, responses((status = OK, body = SignupResponse)))]
pub async fn signup(
    State(state): State<AppState>,
    Json(payload): Json<SignupRequest>,
) -> Result<Json<SignupResponse>, AppError> {
    Ok(Json(SignupResponse {
        id: uuid::Uuid::new_v4(),
        email: String::from("user@example.com"),
        verified_at: None,
        created_at: chrono::Utc::now(),
        updated_at: chrono::Utc::now(),
    }))
}
