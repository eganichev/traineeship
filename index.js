module.exports = functions.firestore
  .document("orders/{orderId}")
  .onCreate(async (orderData, context) => {
    let orderId = orderData.id;
    const order = orderData.data() as OrderData
    const productId = order.product.id;
    await handleOrderStatusUpdated(order, orderId);
    const carrierId = order.carrierId;
    const retailerId = order.retailer.id;

    if (carrierId) {
      const carrierDoc = await carriers.doc(carrierId).get();
      if (carrierDoc.exists) {
        let carrier = carrierDoc.data();
        const { notificationEmail, carrierApi } = carrier;
        if (carrierApi) {
          if (carrierApi.routigo) {
            await processRoutigoOrder(carrierApi.routigo, order, orderData.id);
          }
          if (carrierApi.veloyd) {
            await processVeloydOrder(carrierApi.veloyd, order, orderData.id);
          }
          if (carrierApi.packaly) {
            await processPackalyOrder(carrierApi.packaly, order, orderData.id);
          }
        }
        if (notificationEmail) {
          await emailOrder(orderData.id, order, [notificationEmail]);
        }
        await processTrackAndTraceSending(
          retailerId,
          carrierId,
          orderId,
          order
        );
      }
    }

    return processOrder(orderData.id, order);
  });
