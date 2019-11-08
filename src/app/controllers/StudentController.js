import * as Yup from 'yup';
import Student from '../models/Student';

class StudentController {
  async store(req, res) {
    const schema = Yup.object().shape({
      name: Yup.string().required(),
      email: Yup.string()
        .email()
        .required(),
      birthdate: Yup.date()
        .required()
        .min(new Date(1900, 0, 1)),
      weight: Yup.number()
        .required()
        .min(0)
        .max(300),
      height: Yup.number()
        .required()
        .min(0)
        .max(3.0),
    });

    if (!(await schema.isValid(req.body))) {
      return res.status(400).json({ error: 'Data validation failed' });
    }

    const studentExists = await Student.findOne({
      where: { email: req.body.email },
    });

    if (studentExists) {
      return res.status(400).json({ error: 'Student already registered' });
    }

    const { id, name, email, birthdate, weight, height } = await Student.create(
      req.body
    );

    return res.json({
      id,
      name,
      email,
      birthdate,
      weight,
      height,
    });
  }

  async update(req, res) {
    const schema = Yup.object().shape({
      id: Yup.number().required(),
      name: Yup.string(),
      email: Yup.string().email(),
      birthdate: Yup.date().min(new Date(1900, 0, 1)),
      weight: Yup.number()
        .min(0)
        .max(300),
      height: Yup.number()
        .min(0)
        .max(3.0),
    });

    if (!(await schema.isValid(req.body))) {
      return res.status(400).json({ error: 'Data validation failed' });
    }

    const student = await Student.findByPk(req.body.id);

    if (req.body.email && req.body.email !== student.email) {
      const studentExists = await Student.findOne({
        where: { email: req.body.email },
      });

      if (studentExists) {
        return res.status(400).json({ error: 'Student already registered' });
      }
    }

    const { id, name, email, birthdate, weight, height } = await student.update(
      req.body
    );

    return res.json({
      id,
      name,
      email,
      birthdate,
      weight,
      height,
    });
  }
}

export default new StudentController();
