import { Tabs, Card, Input } from 'antd';
import { useEffect, useState, useRef, useMemo } from 'react';
import style from './app.module.css';
import Setting from './setting'


window.vscodeInstance = window.acquireVsCodeApi();

function App() {

    const [data, setData] = useState([]);
    const [tabKey, setTabKey] = useState();
    const [searchKey, setSearchKey] = useState();

    useEffect(() => {
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
        window.vscodeInstance.postMessage({
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
                return item[0].toUpperCase().indexOf(searchKey.toUpperCase()) > -1
            })
        }
        return files
    }, [files, searchKey])

    const onChange = e => {
        setSearchKey(e.target.value);
    }

    const openSetting = () => {
        window.vscodeInstance.postMessage({
            command: 'settingData',
            settingData: []
        })
    }

    const contentHtml = filterFiles && filterFiles.length > 0 ? (
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
                                <Card key={item[0]} onClick={() => insertComponent(item[0], curObj)}>
                                    <div className={style["card-name"]}>{item[0]}</div>
                                    {
                                        curObj.snapshot && curObj.snapshot[item[0]] &&
                                        (
                                            <div className={style["card-img-wrap"]}>
                                                <div className={style["card-img-outer"]}>
                                                    <img src={curObj.snapshot[item[0]]} />
                                                </div>
                                            </div>
                                        )
                                    }
                                </Card>
                            </li>
                        )
                    })
                }
            </ul>
        </div>
    ) : <Setting />

    const mainHtml = filterFiles && filterFiles.length > 0 ? (
        <Tabs onChange={tabChange} centered>
            {
                data.map(item => {
                    return <Tabs.TabPane tab={item.cateName} key={item.key}>
                        {contentHtml}
                    </Tabs.TabPane>
                })
            }
        </Tabs>) : <Setting />

    return (
        <div className={style.app}>
            {
                filterFiles && filterFiles.length > 0 ?
                    <div className={style["reset-wrap"]}>
                        <a onClick={openSetting} className={style.reset}>重新设置组件路径</a>
                    </div>
                    : null
            }
            {
                data.length > 1 ? mainHtml : data.length === 1 ? contentHtml : <Setting />
            }
        </div>
    );
}

export default App;
