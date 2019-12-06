import { Op } from 'sequelize';
import { subDays } from 'date-fns';
import Enrollment from '../models/Enrollment';
import Checkin from '../models/Checkin';
import Student from '../models/Student';

class CheckinController {
  async index(req, res) {
    const { page = 1 } = req.query;

    const checkins = await Checkin.findAll({
      where: { student_id: req.params.id },
      attributes: ['created_at'],
      limit: 20,
      offset: (page - 1) * 20,
      include: [
        {
          model: Student,
          as: 'student',
          attributes: ['name', 'email'],
        },
      ],
    });

    return res.json(checkins);
  }

  async store(req, res) {
    const today = Date.now();

    const checkActiveEnrollment = await Enrollment.findOne({
      where: {
        student_id: req.params.id,
        start_date: { [Op.lte]: today },
        end_date: { [Op.gte]: today },
      },
    });

    if (!checkActiveEnrollment) {
      return res.status(401).json({ error: 'There is no active enrollment' });
    }

    const weekCheckins = await Checkin.findAll({
      where: {
        student_id: req.params.id,
        created_at: { [Op.gte]: subDays(today, 7) },
      },
    });

    if (weekCheckins.length >= 5) {
      return res.status(401).json({ error: 'User has reached checkins limit' });
    }

    await Checkin.create({ student_id: req.params.id });

    return res.json();
  }
}

export default new CheckinController();
