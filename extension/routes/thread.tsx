import { Button } from '@arco-design/web-react';
import React, { useRef } from 'react';
import { useNavigate} from 'react-router-dom';


export const Thread = () => {
    const navigate = useNavigate();

    return <div>

        <Button onClick={() => navigate('/')}>返回</Button>
        thread
    </div>
}