import './index.scss';

export const CardBox = ({children, onClick}) => {
  return (
    <div
      className="p-4 m-3 border rounded-lg card-box w-72 border-black/8 hover:bg-gray-500/10"
      onClick={() => onClick()}  
    >
      {children}
    </div>
  );
};
