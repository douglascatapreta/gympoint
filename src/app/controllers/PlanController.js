import * as Yup from 'yup';
import Plan from '../models/Plan';
import User from '../models/User';

class PlanController {
  async index(req, res) {
    const plans = await Plan.findAll({
      order: ['title'],
      attributes: ['id', 'title', 'duration', 'price'],
    });

    return res.json(plans);
  }

  async store(req, res) {
    const checkUserAdmin = await User.findByPk(req.userId);

    if (!checkUserAdmin) {
      return res.status(401).json({ error: 'User is not an administrator' });
    }

    const schema = Yup.object().shape({
      title: Yup.string().required(),
      duration: Yup.number().required(),
      price: Yup.number().required(),
    });

    if (!(await schema.isValid(req.body))) {
      return res.status(400).json({ error: 'Data validation failed' });
    }

    const planExists = await Plan.findOne({
      where: { title: req.body.title },
    });

    if (planExists) {
      return res.status(400).json({ error: 'Plan already registered' });
    }

    const { id, title, duration, price } = await Plan.create(req.body);

    return res.json({
      id,
      title,
      duration,
      price,
    });
  }

  async update(req, res) {
    const checkUserAdmin = await User.findByPk(req.userId);

    if (!checkUserAdmin) {
      return res.status(401).json({ error: 'User is not an administrator' });
    }

    const schema = Yup.object().shape({
      title: Yup.string(),
      duration: Yup.number(),
      price: Yup.number(),
    });

    if (!(await schema.isValid(req.body))) {
      return res.status(400).json({ error: 'Data validation failed' });
    }

    const plan = await Plan.findByPk(req.params.id);

    if (req.body.title && req.body.title !== plan.title) {
      const planExists = await Plan.findOne({
        where: { title: req.body.title },
      });

      if (planExists) {
        return res.status(400).json({ error: 'Plan already registered' });
      }
    }

    const { id, title, duration, price } = await plan.update(req.body);

    return res.json({
      id,
      title,
      duration,
      price,
    });
  }

  async delete(req, res) {
    const checkUserAdmin = await User.findByPk(req.userId);

    if (!checkUserAdmin) {
      return res.status(401).json({ error: 'User is not an administrator' });
    }

    const plan = await Plan.findByPk(req.params.id);

    await plan.destroy();

    return res.json();
  }
}

export default new PlanController();
