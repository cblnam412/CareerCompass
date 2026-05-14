const INTERNAL_SERVICE_TOKEN = process.env.INTERNAL_SERVICE_TOKEN || 'doan1-dev-internal-token';

export const verifyInternalRequest = (req, res, next) => {
    if (req.get('x-internal-token') !== INTERNAL_SERVICE_TOKEN) {
        return res.status(403).json({
            success: false,
            message: 'Internal service token khong hop le'
        });
    }

    next();
};
