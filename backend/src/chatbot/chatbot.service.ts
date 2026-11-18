import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class ChatbotService {
  constructor(private readonly prisma: PrismaService) {}

  private answer(question: string): string {
    const q = question.toLowerCase();
    if (q.includes('ticket') || q.includes('تذكرة') || q.includes('دعم')) {
      return 'يمكنك إرسال طلب دعم من قسم "التذاكر والدعم" ومتابعة حالته. سنرد عليك في أقرب وقت.';
    }
    if (q.includes('product') || q.includes('منتج') || q.includes('متجر') || q.includes('order') || q.includes('طلب')) {
      return 'يمكنك تصفح المنتجات في قسم "المتجر" وإضافةها إلى الطلب. للمساعدة في الطلب، تواصل مع الدعم.';
    }
    if (q.includes('service') || q.includes('خدمة') || q.includes('it support')) {
      return 'نقدم خدمات الدعم الفني، صيانة، واستشارات تقنية. راجع قسم "الخدمات" للاطلاع على القائمة والأسعار.';
    }
    if (q.includes('password') || q.includes('كلمة مرور') || q.includes('login') || q.includes('دخول')) {
      return 'لإعادة تعيين كلمة المرور، استخدم خيار "نسيت كلمة المرور" في صفحة الدخول أو تواصل مع المسؤول.';
    }
    if (q.includes('hello') || q.includes('مرحبا') || q.includes('hi')) {
      return 'مرحبًا! أنا مساعد ShadTech. كيف يمكنني مساعدتك اليوم؟';
    }
    return 'شكرًا لسؤالك. لم أجد إجابة مباشرة، لكن فريق الدعم سيتواصل معك. يمكنك أيضًا تصفح الأقسام: التذاكر، المتجر، الخدمات.';
  }

  async ask(tenantId: string, userId: string | null, question: string) {
    const answer = this.answer(question);
    try {
      await this.prisma.chatMessage.create({
        data: { tenantId, userId: userId || null, question, answer },
      });
    } catch {
      // ignore logging errors
    }
    return { question, answer };
  }

  async history(tenantId: string, limit = 20) {
    return this.prisma.chatMessage.findMany({
      where: { tenantId },
      orderBy: { createdAt: 'desc' },
      take: limit,
    });
  }
}
