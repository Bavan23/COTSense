"""
Utility functions for data processing and conversions.
Provides helpers for converting between different data formats and calculating scores.
"""

from typing import List, Dict, Any, Optional
import pandas as pd
import structlog

from ..db.schemas import ComponentResponse

logger = structlog.get_logger(__name__)


def convert_df_to_components(
    df: pd.DataFrame, 
    similarities: Optional[List[float]] = None
) -> List[ComponentResponse]:
    """
    Convert pandas DataFrame to list of ComponentResponse objects.
    
    Args:
        df: DataFrame with component data
        similarities: Optional list of similarity scores
        
    Returns:
        List of ComponentResponse objects
    """
    components = []
    
    for idx, row in df.iterrows():
        try:
            # Get similarity score if available
            similarity_score = None
            if similarities and idx < len(similarities):
                similarity_score = similarities[idx]
            elif 'similarity_score' in row:
                similarity_score = row['similarity_score']
            
            # Calculate scores
            spec_match = calculate_spec_match_score(similarity_score)
            total_score = calculate_total_score(similarity_score, row)
            
            # Create component response
            component = ComponentResponse(
                id=int(row.get('id', idx)),
                part_number=str(row.get('part_number', row.get('Part Number', ''))),
                manufacturer=str(row.get('manufacturer', row.get('Manufacturer', ''))),
                category=str(row.get('category', row.get('Category', ''))),
                description=str(row.get('description', row.get('Description', ''))) if pd.notna(row.get('description', row.get('Description'))) else None,
                specifications=str(row.get('specifications', row.get('Specifications', ''))) if pd.notna(row.get('specifications', row.get('Specifications'))) else None,
                price=float(row.get('price', row.get('Price', 0))) if pd.notna(row.get('price', row.get('Price'))) else None,
                stock=str(row.get('stock', row.get('Stock', 'Unknown'))) if pd.notna(row.get('stock', row.get('Stock'))) else "Unknown",
                spec_match=spec_match,
                total_score=total_score,
                created_at=None,  # Will be set by database
                updated_at=None   # Will be set by database
            )
            
            components.append(component)
            
        except Exception as e:
            logger.warning("Failed to convert row to component", 
                          row_index=idx, 
                          error=str(e))
            continue
    
    return components


def calculate_spec_match_score(similarity_score: Optional[float]) -> Optional[float]:
    """
    Calculate specification match score from similarity score.
    
    Args:
        similarity_score: Cosine similarity score (-1 to 1)
        
    Returns:
        Specification match score (0 to 100) or None
    """
    if similarity_score is None:
        return None
    
    # Convert similarity score (-1 to 1) to percentage (0 to 100)
    # Cosine similarity of 1 = 100% match, 0 = 50% match, -1 = 0% match
    spec_match = ((similarity_score + 1) / 2) * 100
    return round(spec_match, 1)


def calculate_total_score(
    similarity_score: Optional[float], 
    component_data: pd.Series
) -> Optional[float]:
    """
    Calculate total recommendation score combining multiple factors.
    
    Args:
        similarity_score: Cosine similarity score
        component_data: Component metadata
        
    Returns:
        Total score (0 to 100) or None
    """
    if similarity_score is None:
        return None
    
    # Base score from similarity
    base_score = calculate_spec_match_score(similarity_score)
    if base_score is None:
        return None
    
    # Additional scoring factors
    score_adjustments = 0
    
    # Stock availability bonus
    stock = str(component_data.get('stock', component_data.get('Stock', ''))).lower()
    if 'in stock' in stock or 'available' in stock:
        score_adjustments += 5
    elif 'low stock' in stock:
        score_adjustments += 2
    elif 'out of stock' in stock or 'discontinued' in stock:
        score_adjustments -= 10
    
    # Price factor (prefer components with reasonable pricing)
    price = component_data.get('price', component_data.get('Price'))
    if pd.notna(price) and price > 0:
        # Small bonus for having price information
        score_adjustments += 1
    
    # Description completeness bonus
    description = component_data.get('description', component_data.get('Description', ''))
    if pd.notna(description) and len(str(description)) > 50:
        score_adjustments += 2
    
    # Specifications completeness bonus
    specifications = component_data.get('specifications', component_data.get('Specifications', ''))
    if pd.notna(specifications) and len(str(specifications)) > 20:
        score_adjustments += 3
    
    # Calculate final score
    total_score = base_score + score_adjustments
    
    # Ensure score is within bounds
    total_score = max(0, min(100, total_score))
    
    return round(total_score, 1)


def format_processing_time(time_ms: float) -> str:
    """
    Format processing time for display.
    
    Args:
        time_ms: Processing time in milliseconds
        
    Returns:
        Formatted time string
    """
    if time_ms < 1000:
        return f"{time_ms:.0f}ms"
    else:
        return f"{time_ms/1000:.2f}s"


def clean_text_for_search(text: str) -> str:
    """
    Clean and normalize text for search queries.
    
    Args:
        text: Input text
        
    Returns:
        Cleaned text
    """
    if not text:
        return ""
    
    # Basic text cleaning
    text = str(text).strip()
    
    # Remove extra whitespace
    text = ' '.join(text.split())
    
    return text


def extract_component_features(component_data: Dict[str, Any]) -> Dict[str, Any]:
    """
    Extract key features from component data for analysis.
    
    Args:
        component_data: Component data dictionary
        
    Returns:
        Dictionary of extracted features
    """
    features = {}
    
    # Basic information
    features['has_price'] = component_data.get('price') is not None
    features['has_stock_info'] = component_data.get('stock') is not None
    features['has_description'] = bool(component_data.get('description'))
    features['has_specifications'] = bool(component_data.get('specifications'))
    
    # Text lengths
    description = component_data.get('description', '')
    specifications = component_data.get('specifications', '')
    
    features['description_length'] = len(str(description)) if description else 0
    features['specifications_length'] = len(str(specifications)) if specifications else 0
    
    # Category information
    category = component_data.get('category', '').lower()
    features['is_semiconductor'] = 'semiconductor' in category or 'ic' in category
    features['is_passive'] = any(term in category for term in ['resistor', 'capacitor', 'inductor'])
    features['is_connector'] = 'connector' in category
    
    return features


def validate_component_data(component_data: Dict[str, Any]) -> List[str]:
    """
    Validate component data and return list of issues.
    
    Args:
        component_data: Component data to validate
        
    Returns:
        List of validation error messages
    """
    issues = []
    
    # Required fields
    required_fields = ['part_number', 'manufacturer', 'category']
    for field in required_fields:
        if not component_data.get(field):
            issues.append(f"Missing required field: {field}")
    
    # Price validation
    price = component_data.get('price')
    if price is not None:
        try:
            price_float = float(price)
            if price_float < 0:
                issues.append("Price cannot be negative")
        except (ValueError, TypeError):
            issues.append("Price must be a valid number")
    
    # Text field length limits
    text_fields = {
        'part_number': 255,
        'manufacturer': 255,
        'category': 255,
        'stock': 50
    }
    
    for field, max_length in text_fields.items():
        value = component_data.get(field)
        if value and len(str(value)) > max_length:
            issues.append(f"{field} exceeds maximum length of {max_length} characters")
    
    return issues