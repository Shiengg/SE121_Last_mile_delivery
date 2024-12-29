const login = async (req, res) => {
    try {
        const { username, password } = req.body;
        
        // Tìm user
        const user = await User.findOne({ username });
        if (!user) {
            return res.status(401).json({
                success: false,
                message: 'Invalid credentials'
            });
        }

        // Kiểm tra password
        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return res.status(401).json({
                success: false,
                message: 'Invalid credentials'
            });
        }

        // Tạo token với id và role
        const token = jwt.sign(
            { 
                id: user._id,
                role: user.role 
            },
            process.env.JWT_SECRET,
            { 
                expiresIn: '24h' 
            }
        );

        // Log để debug
        console.log('Generated token:', token);
        console.log('User data:', {
            id: user._id,
            role: user.role
        });

        res.json({
            success: true,
            token,
            user: {
                id: user._id,
                username: user.username,
                role: user.role
            }
        });
    } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({
            success: false,
            message: 'Error during login',
            error: error.message
        });
    }
};
