export const validateMajorData = (req, res, next) => {
    const { name, category, description } = req.body;
    const errors = [];

    if (!name || name.trim() === '') {
        errors.push('Name is required');
    } else if (name.length > 100) {
        errors.push('Name must be less than 100 characters');
    }

    if (!category || category.trim() === '') {
        errors.push('Category is required');
    } else if (category.length > 100) {
        errors.push('Category must be less than 100 characters');
    }

    if (description && description.length > 500) {
        errors.push('Description must be less than 500 characters');
    }

    if (errors.length > 0) {
        return res.status(400).json({
            success: false,
            message: 'Validation failed',
            errors
        });
    }

    next();
};

export const validateMajorId = (req, res, next) => {
    const { majorId } = req.params;
    
    if (!majorId || majorId.trim() === '') {
        return res.status(400).json({
            success: false,
            message: 'Major ID is required'
        });
    }

    if (!majorId.match(/^[0-9a-fA-F]{24}$/)) {
        return res.status(400).json({
            success: false,
            message: 'Invalid Major ID format'
        });
    }

    next();
};

export const validateSearchParams = (req, res, next) => {
    const { page, limit, search, category, sortBy, sortOrder } = req.query;

    const errors = [];

    if (page && (isNaN(page) || parseInt(page) < 1)) {
        errors.push('Page must be a positive number');
    }

    if (limit && (isNaN(limit) || parseInt(limit) < 1 || parseInt(limit) > 100)) {
        errors.push('Limit must be between 1 and 100');
    }

    if (sortBy && !['name', 'category', 'createdAt'].includes(sortBy)) {
        errors.push('Invalid sortBy field. Must be: name, category, or createdAt');
    }

    if (sortOrder && !['asc', 'desc'].includes(sortOrder.toLowerCase())) {
        errors.push('Invalid sortOrder. Must be: asc or desc');
    }

    if (errors.length > 0) {
        return res.status(400).json({
            success: false,
            message: 'Validation failed',
            errors
        });
    }

    next();
};
