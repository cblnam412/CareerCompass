import mongoose from 'mongoose';

export const validateObjectIdParam = (paramName = 'id') => (req, res, next) => {
  const value = req.params[paramName];
  if (!mongoose.Types.ObjectId.isValid(value)) {
    return res.status(400).json({
      success: false,
      message: `${paramName} khong hop le`,
    });
  }
  next();
};

export const validateStudentProfilePayload = (req, res, next) => {
  const { gpa, academicTranscript, softSkills, targetUniversityIds } = req.body;

  if (gpa !== undefined && (typeof Number(gpa) !== 'number' || Number.isNaN(Number(gpa)) || Number(gpa) < 0 || Number(gpa) > 10)) {
    return res.status(400).json({ success: false, message: 'GPA phai nam trong khoang 0-10' });
  }

  if (academicTranscript !== undefined && !Array.isArray(academicTranscript)) {
    return res.status(400).json({ success: false, message: 'academicTranscript phai la mang' });
  }

  if (Array.isArray(academicTranscript)) {
    for (const item of academicTranscript) {
      if (!item?.subjectId || item.score === undefined) {
        return res.status(400).json({ success: false, message: 'Moi diem mon hoc phai co subjectId va score' });
      }
      if (!mongoose.Types.ObjectId.isValid(item.subjectId)) {
        return res.status(400).json({ success: false, message: 'subjectId khong hop le' });
      }
      const score = Number(item.score);
      if (Number.isNaN(score) || score < 0 || score > 10) {
        return res.status(400).json({ success: false, message: 'Diem mon hoc phai nam trong khoang 0-10' });
      }
    }
  }

  if (softSkills !== undefined && !Array.isArray(softSkills)) {
    return res.status(400).json({ success: false, message: 'softSkills phai la mang' });
  }

  if (targetUniversityIds !== undefined && !Array.isArray(targetUniversityIds)) {
    return res.status(400).json({ success: false, message: 'targetUniversityIds phai la mang' });
  }

  if (Array.isArray(softSkills) && softSkills.some((id) => !mongoose.Types.ObjectId.isValid(id))) {
    return res.status(400).json({ success: false, message: 'softSkills chua id khong hop le' });
  }

  if (Array.isArray(targetUniversityIds) && targetUniversityIds.some((id) => !mongoose.Types.ObjectId.isValid(id))) {
    return res.status(400).json({ success: false, message: 'targetUniversityIds chua id khong hop le' });
  }

  next();
};

export const validateScorePayload = (req, res, next) => {
  const { subjectId, score } = req.body;

  if (!subjectId || score === undefined) {
    return res.status(400).json({ success: false, message: 'subjectId va score la bat buoc' });
  }

  if (!mongoose.Types.ObjectId.isValid(subjectId)) {
    return res.status(400).json({ success: false, message: 'subjectId khong hop le' });
  }

  const numericScore = Number(score);
  if (Number.isNaN(numericScore) || numericScore < 0 || numericScore > 10) {
    return res.status(400).json({ success: false, message: 'Diem phai nam trong khoang 0-10' });
  }

  req.body.score = numericScore;
  next();
};
