import * as Yup from 'yup';
import HelpOrder from '../models/HelpOrder';

class StudentHelpOrderController {
  async index(req, res) {
    const helpOrders = await HelpOrder.findAll({
      where: { student_id: req.params.id },
    });

    return res.json(helpOrders);
  }

  async store(req, res) {
    const schema = Yup.object().shape({
      question: Yup.string().required(),
    });

    if (!(await schema.isValid(req.body))) {
      return res.status(400).json({ error: 'Data validation failed' });
    }

    const helpOrder = await HelpOrder.create({
      student_id: req.params.id,
      question: req.body.question,
    });

    return res.json(helpOrder);
  }
}

export default new StudentHelpOrderController();
