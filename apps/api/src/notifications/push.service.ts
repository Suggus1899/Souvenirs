import { Injectable, Logger } from '@nestjs/common';
import { Expo } from 'expo-server-sdk';

@Injectable()
export class PushService {
  private readonly logger = new Logger(PushService.name);
  private readonly expo = new Expo();

  async sendToTokens(
    tokens: string[],
    title: string,
    body: string,
  ): Promise<void> {
    const validTokens = tokens.filter((token) => Expo.isExpoPushToken(token));
    if (validTokens.length === 0) {
      this.logger.warn(
        `No valid Expo push tokens to notify (title="${title}")`,
      );
      return;
    }

    const messages = validTokens.map((to) => ({ to, title, body }));
    const chunks = this.expo.chunkPushNotifications(messages);
    for (const chunk of chunks) {
      await this.expo.sendPushNotificationsAsync(chunk);
    }
  }
}
