export const getISTDate = () => {
    const now = new Date();
    const istOffset = 5.5 * 60 * 60 * 1000;
    return new Date(now.getTime() + istOffset);
};

export function isTimeInRange(start, end) {
    const ist = getISTDate();
    const hr = ist.getUTCHours();
    return hr >= start && hr < end;
}

export function checkAudioUploadWindow(req, res, next) {
    if (isTimeInRange(14, 19)) {
        next();
    } else {
        res.status(403).json({ message: "You can't do this right now. Try between 2 PM and 7 PM IST" });
    }
}

export const checkPaymentWindow = (req, res, next) => {
    if (isTimeInRange(10, 11)) {
        next();
    } else {
        res.status(403).json({ message: "Payments only accepted between 10 AM and 11 AM IST" });
    }
};

export const checkMobileAccessWindow = (ua) => {
    const isMobile = /Mobile|Android|iPhone|iPad|iPod/.test(ua);
    if (!isMobile) return true;
    return isTimeInRange(10, 13);
};
