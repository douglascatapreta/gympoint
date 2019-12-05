import { format, parseISO } from 'date-fns';
import Mail from '../../lib/Mail';

class ConfirmationMail {
  get key() {
    return 'ConfirmationMail';
  }

  async handle({ data }) {
    const { enrollment } = data;

    await Mail.sendMail({
      to: `${enrollment.student.name} <${enrollment.student.email}>`,
      subject: 'Confirmação de matrícula',
      template: 'confirmation',
      context: {
        student: enrollment.student.name,
        plan: enrollment.plan.title,
        start_date: format(
          parseISO(enrollment.start_date),
          "dd' / 'MM' / 'yyyy"
        ),
        end_date: format(parseISO(enrollment.end_date), "dd' / 'MM' / 'yyyy"),
        price: Number(enrollment.price)
          .toFixed(2)
          .toString()
          .replace('.', ','),
      },
    });
  }
}

export default new ConfirmationMail();
