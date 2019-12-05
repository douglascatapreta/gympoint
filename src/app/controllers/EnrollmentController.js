import * as Yup from 'yup';
import { Op } from 'sequelize';
import { addMonths, parseISO } from 'date-fns';
import Enrollment from '../models/Enrollment';
import Plan from '../models/Plan';
import User from '../models/User';
import Student from '../models/Student';
import Queue from '../../lib/Queue';
import ConfirmationMail from '../jobs/ConfirmationMail';

class EnrollmentController {
  async index(req, res) {
    const checkUserAdmin = await User.findByPk(req.userId);

    if (!checkUserAdmin) {
      return res.status(401).json({ error: 'User is not an administrator' });
    }

    const { page = 1 } = req.query;

    const enrollments = await Enrollment.findAll({
      order: ['start_date'],
      attributes: ['id', 'start_date', 'end_date', 'price'],
      limit: 20,
      offset: (page - 1) * 20,
      include: [
        {
          model: Student,
          as: 'student',
          attributes: ['name', 'email'],
        },
        {
          model: Plan,
          as: 'plan',
          attributes: ['title', 'duration', 'price'],
        },
      ],
    });

    return res.json(enrollments);
  }

  async store(req, res) {
    const checkUserAdmin = await User.findByPk(req.userId);

    if (!checkUserAdmin) {
      return res.status(401).json({ error: 'User is not an administrator' });
    }

    const schema = Yup.object().shape({
      student_id: Yup.number().required(),
      plan_id: Yup.number().required(),
      start_date: Yup.date().required(),
    });

    if (!(await schema.isValid(req.body))) {
      return res.status(400).json({ error: 'Data validation failed' });
    }

    const activeEnrollmentExists = await Enrollment.findOne({
      where: {
        student_id: req.body.student_id,
        end_date: { [Op.gte]: req.body.start_date },
      },
    });

    if (activeEnrollmentExists) {
      return res.status(400).json({
        error: 'The student still has an active enrollment on this start date.',
      });
    }

    const plan = await Plan.findByPk(req.body.plan_id);

    let enrollment = await Enrollment.create({
      student_id: req.body.student_id,
      plan_id: req.body.plan_id,
      start_date: req.body.start_date,
      end_date: addMonths(parseISO(req.body.start_date), plan.duration),
      price: plan.price * plan.duration,
    });

    enrollment = await Enrollment.findByPk(enrollment.id, {
      include: [
        {
          model: Student,
          as: 'student',
          attributes: ['name', 'email'],
        },
        {
          model: Plan,
          as: 'plan',
          attributes: ['title', 'duration', 'price'],
        },
      ],
    });

    await Queue.add(ConfirmationMail.key, { enrollment });

    return res.json({
      id: enrollment.id,
      student_id: enrollment.student_id,
      plan_id: enrollment.plan_id,
      start_date: enrollment.start_date,
      end_date: enrollment.end_date,
      price: enrollment.price,
    });
  }

  async update(req, res) {
    const checkUserAdmin = await User.findByPk(req.userId);

    if (!checkUserAdmin) {
      return res.status(401).json({ error: 'User is not an administrator' });
    }

    const schema = Yup.object().shape({
      student_id: Yup.number(),
      plan_id: Yup.number(),
      start_date: Yup.date(),
    });

    if (!(await schema.isValid(req.body))) {
      return res.status(400).json({ error: 'Data validation failed' });
    }

    const enrollment = await Enrollment.findByPk(req.params.id);

    if (req.body.plan_id && !req.body.start_date) {
      const plan = await Plan.findByPk(req.body.plan_id);

      req.body.price = plan.duration * plan.price;

      req.body.end_date = addMonths(enrollment.start_date, plan.duration);
    } else if (!req.body.plan_id && req.body.start_date) {
      const plan = await Plan.findByPk(enrollment.plan_id);

      req.body.end_date = addMonths(
        parseISO(req.body.start_date),
        plan.duration
      );
    } else if (req.body.plan_id && req.body.start_date) {
      const plan = await Plan.findByPk(req.body.plan_id);

      req.body.price = plan.duration * plan.price;

      req.body.end_date = addMonths(
        parseISO(req.body.start_date),
        plan.duration
      );
    }

    const {
      id,
      student_id,
      plan_id,
      start_date,
      end_date,
      price,
    } = await enrollment.update(req.body);

    return res.json({ id, student_id, plan_id, start_date, end_date, price });
  }

  async delete(req, res) {
    const checkUserAdmin = await User.findByPk(req.userId);

    if (!checkUserAdmin) {
      return res.status(401).json({ error: 'User is not an administrator' });
    }

    const enrollment = await Enrollment.findByPk(req.params.id);

    await enrollment.destroy();

    return res.json();
  }
}

export default new EnrollmentController();
