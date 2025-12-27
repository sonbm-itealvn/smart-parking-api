import axios from "axios";

/**
 * Service để gửi push notification qua Firebase Cloud Messaging (FCM)
 */
export class PushNotificationService {
  private static readonly FCM_SERVER_KEY = process.env.FCM_SERVER_KEY || "";
  private static readonly FCM_API_URL = "https://fcm.googleapis.com/fcm/send";

  /**
   * Gửi push notification đến một device token
   * @param deviceToken FCM device token
   * @param title Tiêu đề thông báo
   * @param body Nội dung thông báo
   * @param data Dữ liệu bổ sung (optional)
   */
  static async sendNotification(
    deviceToken: string,
    title: string,
    body: string,
    data?: Record<string, any>
  ): Promise<boolean> {
    try {
      // Kiểm tra FCM server key
      if (!this.FCM_SERVER_KEY) {
        console.warn("FCM_SERVER_KEY not configured. Push notification will not be sent.");
        return false;
      }

      // Kiểm tra device token
      if (!deviceToken || deviceToken.trim() === "") {
        console.warn("Device token is empty. Push notification will not be sent.");
        return false;
      }

      const payload = {
        to: deviceToken,
        notification: {
          title: title,
          body: body,
          sound: "default",
          badge: "1",
        },
        data: data || {},
        priority: "high",
      };

      const response = await axios.post(this.FCM_API_URL, payload, {
        headers: {
          "Content-Type": "application/json",
          Authorization: `key=${this.FCM_SERVER_KEY}`,
        },
      });

      if (response.status === 200) {
        console.log("Push notification sent successfully:", response.data);
        return true;
      } else {
        console.error("Failed to send push notification:", response.data);
        return false;
      }
    } catch (error: any) {
      console.error("Error sending push notification:", error.response?.data || error.message);
      return false;
    }
  }

  /**
   * Gửi push notification đến nhiều device tokens
   * @param deviceTokens Mảng các FCM device tokens
   * @param title Tiêu đề thông báo
   * @param body Nội dung thông báo
   * @param data Dữ liệu bổ sung (optional)
   */
  static async sendNotificationToMultiple(
    deviceTokens: string[],
    title: string,
    body: string,
    data?: Record<string, any>
  ): Promise<{ success: number; failed: number }> {
    let success = 0;
    let failed = 0;

    // Gửi notification đến từng device token
    for (const token of deviceTokens) {
      const result = await this.sendNotification(token, title, body, data);
      if (result) {
        success++;
      } else {
        failed++;
      }
    }

    return { success, failed };
  }

  /**
   * Gửi thông báo khi xe vào bãi đỗ
   * @param deviceToken FCM device token
   * @param licensePlate Biển số xe
   * @param slotCode Mã slot
   * @param parkingLotName Tên bãi đỗ (optional)
   */
  static async sendVehicleEntryNotification(
    deviceToken: string,
    licensePlate: string,
    slotCode: string,
    parkingLotName?: string
  ): Promise<boolean> {
    const title = "Xe đã vào bãi đỗ";
    const body = parkingLotName
      ? `Xe ${licensePlate} đã vào bãi đỗ ${parkingLotName} tại vị trí ${slotCode}`
      : `Xe ${licensePlate} đã vào bãi đỗ tại vị trí ${slotCode}`;

    const data = {
      type: "vehicle_entry",
      licensePlate: licensePlate,
      slotCode: slotCode,
      parkingLotName: parkingLotName || "",
      timestamp: new Date().toISOString(),
    };

    return await this.sendNotification(deviceToken, title, body, data);
  }

  /**
   * Gửi thông báo khi xe ra khỏi bãi đỗ
   * @param deviceToken FCM device token
   * @param licensePlate Biển số xe
   * @param totalFee Tổng phí
   */
  static async sendVehicleExitNotification(
    deviceToken: string,
    licensePlate: string,
    totalFee: number
  ): Promise<boolean> {
    const title = "Xe đã ra khỏi bãi đỗ";
    const body = `Xe ${licensePlate} đã ra khỏi bãi đỗ. Tổng phí: ${totalFee.toLocaleString("vi-VN")} VNĐ`;

    const data = {
      type: "vehicle_exit",
      licensePlate: licensePlate,
      totalFee: totalFee.toString(),
      timestamp: new Date().toISOString(),
    };

    return await this.sendNotification(deviceToken, title, body, data);
  }
}

