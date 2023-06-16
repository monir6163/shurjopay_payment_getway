import dbConnect from "@/lib/db";
import Order from "@/models/order";

export default async function handler(req, res) {
    await dbConnect();
    const { method } = req;
    switch (method) {
        case "PUT":
            try {
                const { id } = req.query;
                const { status } = req.body;
                if (!id || !status) {
                    return res.status(400).json({
                        success: false,
                        message: "Order ID is required",
                    });
                }
                const order = await Order.findByIdAndUpdate(id, {
                    status,
                });
                if (order) {
                    res.status(200).json({
                        success: true,
                        message: "Order Updated Successfully",
                    });
                } else {
                    res.status(400).json({
                        success: false,
                        message: "Order Not Found",
                    });
                }
            } catch (error) {
                res.status(502).json({
                    success: false,
                    message: "bad gateway",
                });
            }
            break;
        case "DELETE":
            try {
                const { id } = req.query;
                if (!id) {
                    return res.status(400).json({
                        success: false,
                        message: "Order ID is required",
                    });
                }
                const order = await Order.findByIdAndDelete(id);
                if (order) {
                    res.status(200).json({
                        success: true,
                        message: "Order Deleted Successfully",
                    });
                } else {
                    res.status(400).json({
                        success: false,
                        message: "Order Not Found",
                    });
                }
            } catch (error) {
                res.status(502).json({
                    success: false,
                    message: "bad gateway",
                });
            }
            break;
        default:
            res.status(500).json({
                success: false,
                message: "Server Error",
            });
    }
}
