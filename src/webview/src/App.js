import { Tabs, Card, Input } from 'antd';
import { useEffect, useState, useRef, useMemo } from 'react';
import style from './app.module.css';
const { Search } = Input;

function App () {

    const [data, setData] = useState([]);
    const [tabKey, setTabKey] = useState();
    const [searchKey, setSearchKey] = useState();
    const vscodeRef = useRef();

    useEffect(() => {
        vscodeRef.current = window.acquireVsCodeApi();
        // const message = window.message;

        if (window.directories) {
            setDirectories(window.directories)
        } else {
            window.addEventListener('message', event => {
                const message = event.data; // The JSON data our extension sent
                if (message.command === 'getDirectories') {
                    const directories = message.directories;
                    setDirectories(directories)
                }
            });
        }

    }, [])

    const setDirectories = (directories) => {
        setData(directories)
        if (directories && directories[0] && directories[0].key) {
            setTabKey(directories[0].key)
        }
    }

    const insertComponent = (componentName, cateInfo) => {
        vscodeRef.current.postMessage({
            command: 'insertComponent',
            text: componentName,
            cateInfo
        })
    }

    const tabChange = (key) => {
        setTabKey(key);
        setSearchKey('')
    }

    const curObj = useMemo(() => {
        return data.find(item => item.key === tabKey);
    }, [tabKey])

    const files = useMemo(() => {
        if (curObj) {
            return curObj.files
        }
        return undefined
    }, [curObj])

    const filterFiles = useMemo(() => {
        if (files && searchKey) {
            return files.filter(item => {
                return item[0].indexOf(searchKey) > -1
            })
        }
        return files
    }, [files, searchKey])

    const onChange = e => {
        setSearchKey(e.target.value);
    }

    const contentHtml = (
        <div>
            <div className={style.search}>
                <Input
                    placeholder="请输入组件名称"
                    allowClear
                    size="large"
                    value={searchKey}
                    onChange={onChange}
                />
            </div>
            <ul className={style["card-wrap"]}>
                {
                    filterFiles && filterFiles.length > 0 && filterFiles.map(item => {
                        return (
                            <li className={style.card}>
                                <Card key={item[0]} onClick={() => insertComponent(item[0], curObj)}>{item[0]}{
                                    curObj.snapshot && curObj.snapshot[item[0]] && <img src={curObj.snapshot[item[0]]} />
                                }</Card>
                            </li>
                        )
                    })
                }
            </ul>
        </div>
    )

    return (
        <div className="App">
            {
                data.length > 1 ? (
                    <Tabs onChange={tabChange} centered>
                        {
                            data.map(item => {
                                return <Tabs.TabPane tab={item.cateName} key={item.key}>
                                    {contentHtml}
                                </Tabs.TabPane>
                            })
                        }
                    </Tabs>
                ) : contentHtml
            }
        </div>
    );
}

export default App;
