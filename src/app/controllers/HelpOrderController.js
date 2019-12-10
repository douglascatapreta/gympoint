import * as Yup from 'yup';
import HelpOrder from '../models/HelpOrder';
import User from '../models/User';
import Student from '../models/Student';
import Queue from '../../lib/Queue';
import AnswerMail from '../jobs/AnswerMail';

class HelpOrderController {
  async index(req, res) {
    const checkUserAdmin = await User.findByPk(req.userId);

    if (!checkUserAdmin) {
      return res.status(401).json({ error: 'User is not an administrator' });
    }

    const helpOrders = await HelpOrder.findAll({ where: { answer_at: null } });

    return res.json(helpOrders);
  }

  async update(req, res) {
    const checkUserAdmin = await User.findByPk(req.userId);

    if (!checkUserAdmin) {
      return res.status(401).json({ error: 'User is not an administrator' });
    }

    const schema = Yup.object().shape({
      answer: Yup.string().required(),
    });

    if (!(await schema.isValid(req.body))) {
      return res.status(400).json({ error: 'Data validation failed' });
    }

    let helpOrder = await HelpOrder.findOne({
      where: { id: req.params.id, answer_at: null },
      include: [
        {
          model: Student,
          as: 'student',
          attributes: ['name', 'email'],
        },
      ],
    });

    if (!helpOrder) {
      return res.status(401).json({ error: 'Help order already answered' });
    }

    helpOrder = await helpOrder.update({
      answer: req.body.answer,
      answer_at: Date.now(),
    });

    await Queue.add(AnswerMail.key, { helpOrder });

    return res.json(helpOrder);
  }
}

export default new HelpOrderController();
