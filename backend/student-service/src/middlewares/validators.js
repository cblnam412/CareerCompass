import mongoose from 'mongoose';

export const validateObjectIdParam = (paramName = 'id') => (req, res, next) => {
  const value = req.params[paramName];
  if (!mongoose.Types.ObjectId.isValid(value)) {
    return res.status(400).json({
      success: false,
      message: `${paramName} không hợp lệ`,
    });
  }
  next();
};

export const validateStudentProfilePayload = (req, res, next) => {
  const { gpa, academicTranscript, softSkills, targetUniversityIds } = req.body;

  if (gpa !== undefined && (typeof Number(gpa) !== 'number' || Number.isNaN(Number(gpa)) || Number(gpa) < 0 || Number(gpa) > 10)) {
    return res.status(400).json({ success: false, message: 'GPA phải nằm trong khoảng 0-10' });
  }

  if (academicTranscript !== undefined && !Array.isArray(academicTranscript)) {
    return res.status(400).json({ success: false, message: 'academicTranscript phải là mảng' });
  }

  if (Array.isArray(academicTranscript)) {
    for (const item of academicTranscript) {
      if (!item?.subjectId || item.score === undefined) {
        return res.status(400).json({ success: false, message: 'Mỗi điểm môn học phải có subjectId và score' });
      }
      if (!mongoose.Types.ObjectId.isValid(item.subjectId)) {
        return res.status(400).json({ success: false, message: 'subjectId không hợp lệ' });
      }
      const score = Number(item.score);
      if (Number.isNaN(score) || score < 0 || score > 10) {
        return res.status(400).json({ success: false, message: 'Điểm môn học phải nằm trong khoảng 0-10' });
      }
    }
  }

  if (softSkills !== undefined && !Array.isArray(softSkills)) {
    return res.status(400).json({ success: false, message: 'softSkills phải là mảng' });
  }

  if (targetUniversityIds !== undefined && !Array.isArray(targetUniversityIds)) {
    return res.status(400).json({ success: false, message: 'targetUniversityIds phải là mảng' });
  }

  if (Array.isArray(softSkills) && softSkills.some((id) => !mongoose.Types.ObjectId.isValid(id))) {
    return res.status(400).json({ success: false, message: 'softSkills chứa id không hợp lệ' });
  }

  if (Array.isArray(targetUniversityIds) && targetUniversityIds.some((id) => !mongoose.Types.ObjectId.isValid(id))) {
    return res.status(400).json({ success: false, message: 'targetUniversityIds chứa id không hợp lệ' });
  }

  next();
};

export const validateScorePayload = (req, res, next) => {
  const { subjectId, score } = req.body;

  if (!subjectId || score === undefined) {
    return res.status(400).json({ success: false, message: 'subjectId và score là bắt buộc' });
  }

  if (!mongoose.Types.ObjectId.isValid(subjectId)) {
    return res.status(400).json({ success: false, message: 'subjectId không hợp lệ' });
  }

  const numericScore = Number(score);
  if (Number.isNaN(numericScore) || numericScore < 0 || numericScore > 10) {
    return res.status(400).json({ success: false, message: 'Điểm phải nằm trong khoảng 0-10' });
  }

  req.body.score = numericScore;
  next();
};
