import React,{useState} from 'react';
import StoryList from './components/StoryList';
import StoryEditor from './components/StoryEditor';
import CreateStory from './components/CreateStory';
export default function App(){
  const[v,setV]=useState('list');const[id,setId]=useState(null);const[show,setShow]=useState(false);
  return <div>
    {v==='list'&&<>
      <button onClick={()=>setShow(true)}>Create</button>
      <StoryList onSelectStory={(i)=>{setId(i);setV('editor')}}/>
    </>}
    {v==='editor'&&id&&<StoryEditor storyId={id} onBack={()=>setV('list')}/>}
    {show&&<CreateStory onClose={()=>setShow(false)} onCreated={(i)=>{setId(i);setV('editor');setShow(false)}}/>}
  </div>;
}