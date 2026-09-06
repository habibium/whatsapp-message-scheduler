use utoipa_axum::{router::OpenApiRouter, routes};

use crate::AppState;

mod dto;
mod handlers;

pub fn router() -> OpenApiRouter<AppState> {
    OpenApiRouter::new().routes(routes!(handlers::signup))
}
