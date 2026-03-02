"""
Calculator routes: food database search, input detection, training parse,
BMI/TDEE plan calculation, and aerobic calorie calculation.
These endpoints consolidate business logic that was previously on the frontend.
"""

from fastapi import APIRouter, HTTPException, status

from app.schemas.calculator import (
    AerobicCalcRequest,
    AerobicCalcResponse,
    DetectInputRequest,
    DetectInputResponse,
    ExerciseCategory,
    FoodInfo,
    FoodSearchRequest,
    NutritionCalcRequest,
    NutritionResult,
    ParsedExercise,
    ParseTrainingRequest,
    ParseTrainingResponse,
    PlanCalcRequest,
    PlanCalcResponse,
    SetDetail,
)
from app.services.calculator import (
    calculate_aerobic,
    calculate_plan,
    detect_input_type,
    get_exercise_categories,
    try_local_training_parse,
)
from app.services.food_database import (
    calculate_nutrition,
    get_all_foods,
    search_food,
)

router = APIRouter(prefix="/api/calc", tags=["calculator"])


# ── Food Database ────────────────────────────────────────────────────

@router.get("/foods", response_model=list[FoodInfo])
async def list_foods():
    """List all foods in the local database."""
    return get_all_foods()


@router.post("/food-search", response_model=FoodInfo | None)
async def food_search(body: FoodSearchRequest):
    """Search for a food in the local database by name."""
    result = search_food(body.food_name)
    return result


@router.post("/food-nutrition", response_model=NutritionResult)
async def food_nutrition(body: NutritionCalcRequest):
    """Search for a food and calculate nutrition for a given amount in grams."""
    food_data = search_food(body.food_name)
    if not food_data:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Food '{body.food_name}' not found in database",
        )
    result = calculate_nutrition(food_data, body.grams)
    return result


# ── Input Detection ──────────────────────────────────────────────────

@router.post("/detect-input", response_model=DetectInputResponse)
async def detect_input(body: DetectInputRequest):
    """Detect whether user input is food or training related."""
    input_type = detect_input_type(body.message)
    return DetectInputResponse(type=input_type)


# ── Training Local Parse ─────────────────────────────────────────────

@router.post("/parse-training-local", response_model=ParseTrainingResponse)
async def parse_training_local(body: ParseTrainingRequest):
    """
    Try to parse training input locally using regex patterns.
    Returns parsed exercise data or success=false if cannot parse.
    Falls back to AI parsing on the frontend if this returns success=false.
    """
    result = try_local_training_parse(body.message)
    if result is None:
        return ParseTrainingResponse(success=False)

    exercise = ParsedExercise(
        name=result["name"],
        weight=result["weight"],
        sets=result["sets"],
        reps=result["reps"],
        set_details=[SetDetail(**s) for s in result["set_details"]],
    )
    return ParseTrainingResponse(success=True, exercise=exercise)


# ── Plan Calculator ──────────────────────────────────────────────────

@router.post("/plan", response_model=PlanCalcResponse)
async def calculate_fitness_plan(body: PlanCalcRequest):
    """Calculate BMI, BMR, TDEE, calorie balance, and macros."""
    result = calculate_plan(
        gender=body.gender,
        height_cm=body.height_cm,
        weight_kg=body.weight_kg,
        age=body.age,
        training_level=body.training_level,
        aerobic_calories=body.aerobic_calories,
    )
    return result


# ── Aerobic Calculator ───────────────────────────────────────────────

@router.get("/exercise-categories", response_model=list[ExerciseCategory])
async def list_exercise_categories():
    """List all exercise categories with their levels."""
    return get_exercise_categories()


@router.post("/aerobic", response_model=AerobicCalcResponse)
async def calculate_aerobic_calories(body: AerobicCalcRequest):
    """Calculate aerobic exercise calories."""
    result = calculate_aerobic(
        weight_kg=body.weight_kg,
        category=body.category,
        level_index=body.level_index,
        hours=body.hours,
        minutes=body.minutes,
        frequency=body.frequency,
    )
    if result is None:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid exercise category or level index",
        )
    return result
