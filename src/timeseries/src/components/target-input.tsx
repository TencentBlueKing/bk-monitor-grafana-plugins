/*
 * Tencent is pleased to support the open source community by making
 * 蓝鲸智云PaaS平台社区版 (BlueKing PaaS Community Edition) available.
 *
 * Copyright (C) 2021 THL A29 Limited, a Tencent company.  All rights reserved.
 *
 * 蓝鲸智云PaaS平台社区版 (BlueKing PaaS Community Edition) is licensed under the MIT License.
 *
 * License for 蓝鲸智云PaaS平台社区版 (BlueKing PaaS Community Edition):
 *
 * ---------------------------------------------------
 * Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated
 * documentation files (the "Software"), to deal in the Software without restriction, including without limitation
 * the rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the Software, and
 * to permit persons to whom the Software is furnished to do so, subject to the following conditions:
 *
 * The above copyright notice and this permission notice shall be included in all copies or substantial portions of
 * the Software.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO
 * THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF
 * CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS
 * IN THE SOFTWARE.
 */
import Divider from 'antd/es/divider';
import Select from 'antd/es/select';
import Spin from 'antd/es/spin';
import Tooltip from 'antd/es/tooltip';
import React from 'react';

import { type ITargetData, type ITargetItem, TARGET_TYPE } from '../typings/metric';
import { LanguageContext } from '../utils/context';
import { t } from '../utils/utils';
const { Option } = Select;

const clusterParams = {
  params: { label_field: 'bk_set_name', value_field: 'bk_set_id', where: [] },
  type: 'set',
};
export interface ITargetInputProps {
  cluster: ITargetItem[];
  datasource: any;
  host: ITargetItem[];
  module: ITargetItem[];
  onChange: (v: ITargetData) => void;
  targetType: TARGET_TYPE;
}
interface ITargetInputState {
  allHostList: ITargetItem[];
  clusterList: ITargetItem[];
  hasGetCluster: boolean;
  hostList: ITargetItem[];
  loading: boolean;
  moduleList: ITargetItem[];
  searchValue: string;
}
export default class TargetInput extends React.PureComponent<ITargetInputProps, ITargetInputState> {
  constructor(props, context) {
    super(props, context);
    this.state = {
      allHostList: [],
      clusterList: props.cluster,
      hasGetCluster: false,
      hostList: props.host,
      loading: false,
      moduleList: props.module,
      searchValue: '',
    };
  }
  /**
   * @description: 集群变化时触发
   * @param {string} clusters
   * @return {*}
   */
  handleClusterChange = async (clusters: string[]) => {
    const { host, module } = this.props;
    const moduleList = await this.handleGetModuleList(clusters);
    const modules = moduleList.filter(item => module.some(set => set.value === item.value));
    const hostList = await this.handleGetHostList(modules.map(item => item.value));
    const hosts = hostList.filter(item => host.some(set => set.value === item.value));
    this.setState({
      allHostList: hostList,
      hostList: hostList.slice(0, 500),
      moduleList,
    });
    this.props.onChange({
      cluster: this.state.clusterList.filter(item => clusters.includes(item.value)),
      host: hosts,
      module: modules,
    });
  };
  handleClusterFocus = async () => {
    if (!this.state.hasGetCluster) {
      this.setState({ loading: true });
      const list = await this.props.datasource.getVariableValue(clusterParams).catch(() => []);
      this.setState({
        clusterList: list,
        hasGetCluster: true,
        loading: false,
      });
    }
  };
  handleGetHostList = async (moduleIdList: string[]) => {
    let list = [];
    if (moduleIdList?.length) {
      const isHost = this.props.targetType === TARGET_TYPE.HOST;
      const params = {
        params: {
          label_field: isHost ? 'bk_host_innerip' : 'name',
          value_field: isHost ? 'bk_host_innerip|bk_cloud_id' : 'service_instance_id',
          where: [
            { key: 'bk_set_id', method: 'eq', value: this.props.cluster.map(item => item.value) },
            {
              key: isHost ? 'bk_module_ids' : 'bk_module_id',
              method: 'eq',
              value: moduleIdList,
            },
          ],
        },
        type: isHost ? 'host' : 'service_instance',
      };
      list = await this.props.datasource.getVariableValue(params).catch(() => []);
    }
    return list;
  };
  handleGetModuleList = async (clusterList: string[]) => {
    let list = [];
    if (clusterList?.length) {
      const params = {
        params: {
          label_field: 'bk_module_name',
          value_field: 'bk_module_id',
          where: [{ key: 'bk_set_id', method: 'eq', value: clusterList }],
        },
        type: 'module',
      };
      list = await this.props.datasource.getVariableValue(params).catch(() => []);
    }
    return list;
  };
  handleHostChange = async (hosts: string[]) => {
    const { cluster, module } = this.props;
    const host = this.state.allHostList.filter(item => hosts.includes(item.value));
    this.props.onChange({
      cluster,
      host,
      module,
    });
  };
  handleHostDropdownVisibleChange = () => {
    this.setState({ searchValue: '' });
  };
  handleHostFocus = async () => {
    this.setState({ loading: true });
    const list = await this.handleGetHostList(this.props.module.map(item => item.value));
    this.setState({ allHostList: list, hostList: list.slice(0, 500), loading: false });
  };
  /**
   * @description: 模块变化时触发
   * @param {string} modules
   * @return {*}
   */
  handleModuleChange = async (modules: string[]) => {
    const { cluster, host } = this.props;
    const hostList = await this.handleGetHostList(modules);
    const hosts = hostList.filter(item => host.some(set => set.value === item.value));
    this.setState({
      allHostList: hostList,
      hostList: hostList.slice(0, 500),
    });
    this.props.onChange({
      cluster,
      host: hosts,
      module: this.state.moduleList.filter(item => modules.includes(item.value)),
    });
  };
  handleModuleFocus = async () => {
    this.setState({
      loading: true,
    });
    const list = await this.handleGetModuleList(this.props.cluster.map(item => item.value));
    this.setState({
      loading: false,
      moduleList: list,
    });
  };
  handleSearch = (v: string) => {
    let searchV: string | string[] = `${v}`.replace(/\s/gim, ',');
    if (searchV?.length && /,/gim.test(searchV)) {
      searchV = searchV.split(',');
    }
    const hostList = this.state.allHostList
      .filter(item => {
        if (Array.isArray(searchV)) {
          return searchV.some(s => String(item.value).trim() === s || String(item.label).trim() === s);
        }
        return String(item.label).trim().includes(searchV);
      })
      .slice(0, 500);
    if (Array.isArray(searchV) && hostList.length) {
      this.setState({ hostList: this.state.allHostList.slice(0, 500), searchValue: '' });
      return;
    }
    this.setState({ hostList, searchValue: v });
  };
  handleSelectAll = (type: keyof ITargetData) => {
    if (type === 'cluster') {
      const { cluster } = this.props;
      const { clusterList } = this.state;
      const selectedCluster = cluster.length === clusterList.length ? [] : clusterList.map(set => set.value);
      this.handleClusterChange(selectedCluster);
    } else if (type === 'module') {
      const { module } = this.props;
      const { moduleList } = this.state;
      const selectedMoudle = module.length === moduleList.length ? [] : moduleList.map(set => set.value);
      this.handleModuleChange(selectedMoudle);
    } else if (type === 'host') {
      const { host } = this.props;
      const { hostList } = this.state;
      const selectedHost = host.length === hostList.length ? [] : hostList.map(set => set.value);
      this.handleHostChange(selectedHost);
    }
  };
  handleSelectHost = (item: ITargetItem) => {
    const { host } = this.props;
    const selectedHost = host.some(set => set.value === item.value)
      ? host.filter(i => i.value !== item.value)
      : [...host, item];
    this.handleHostChange(selectedHost.map(set => set.value));
  };

  render(): JSX.Element {
    const { clusterList, hostList, loading, moduleList, searchValue } = this.state;
    const { cluster, host, module, targetType } = this.props;
    const clusterValue = cluster.map(item => item.value);
    const moduleValue = module.map(item => item.value);
    const hostValue = host.map(item => item.value);
    const handleMaxTagPlaceholder = v => (
      <Tooltip
        title={v
          .slice(0, 100)
          .map(item => item.label)
          .join(',')}
      >
        <span>{`+${v.length}`}</span>
      </Tooltip>
    );
    const handleDropdownRender = (originNode: any, type) => {
      const needAll = type === 'cluster' ? clusterList.length > 1 : moduleList.length > 1;
      return (
        <Spin spinning={loading}>
          {needAll ? (
            <>
              <div
                className='target-select-all'
                onClick={() => this.handleSelectAll(type)}
              >
                全选
              </div>
              <Divider style={{ margin: 0 }} />
            </>
          ) : undefined}
          <div className='target-dropdown-list'>{originNode}</div>
        </Spin>
      );
    };
    const handleHostDropdownRender = (originNode: any, type) => (
      <Spin spinning={loading}>
        {hostList.length ? (
          <>
            <div
              className='target-select-all'
              onClick={() => this.handleSelectAll(type)}
            >
              全选
            </div>
            <Divider style={{ margin: 0 }} />
            <ul className='select-list'>
              {hostList.map(item => (
                <li
                  key={item.value}
                  className={`select-list-item ${host.some(set => set.value === item.value) ? 'active' : ''}`}
                  onClick={() => this.handleSelectHost(item)}
                >
                  {item.label}
                  {host.some(set => set.value === item.value) ? (
                    <span className='anticon-check'>
                      <svg
                        width='1em'
                        height='1em'
                        fill='currentColor'
                        viewBox='64 64 896 896'
                      >
                        <path d='M912 190h-69.9c-9.8 0-19.1 4.5-25.1 12.2L404.7 724.5 207 474a32 32 0 00-25.1-12.2H112c-6.7 0-10.4 7.7-6.3 12.9l273.9 347c12.8 16.2 37.4 16.2 50.3 0l488.4-618.9c4.1-5.1.4-12.8-6.3-12.8z'></path>
                      </svg>
                    </span>
                  ) : undefined}
                </li>
              ))}
            </ul>
          </>
        ) : (
          originNode
        )}
      </Spin>
    );
    return (
      <LanguageContext.Consumer>
        {({ language }) => (
          <div className='target-input'>
            <Select
              className='target-input-cluster'
              dropdownClassName='target-input-cluster-dropdown'
              dropdownRender={menu => handleDropdownRender(menu, 'cluster')}
              maxTagCount={3}
              maxTagPlaceholder={handleMaxTagPlaceholder}
              mode='multiple'
              optionFilterProp='label'
              options={clusterList}
              placeholder={t('集群', language)}
              value={clusterValue}
              onChange={this.handleClusterChange}
              onFocus={this.handleClusterFocus}
            >
              {/* {clusterList?.map(item => (
                <Option value={item.value} key={item.value}>
                  {item.label}
                </Option>
              ))} */}
            </Select>
            <Select
              style={{ marginRight: 0 }}
              className='target-input-module'
              dropdownClassName='target-input-cluster-dropdown'
              dropdownRender={menu => handleDropdownRender(menu, 'module')}
              maxTagCount={3}
              maxTagPlaceholder={handleMaxTagPlaceholder}
              mode='multiple'
              optionFilterProp='label'
              options={moduleList}
              placeholder={t('模块', language)}
              value={moduleValue}
              onChange={this.handleModuleChange}
              onFocus={this.handleModuleFocus}
            >
              {moduleList?.map(item => (
                <Option
                  key={item.value}
                  value={item.value}
                >
                  {item.label}
                </Option>
              ))}
            </Select>
            <Select
              style={{ marginRight: 0 }}
              className='target-input-host'
              dropdownClassName='target-input-cluster-dropdown'
              dropdownRender={menu => handleHostDropdownRender(menu, 'host')}
              maxTagCount={3}
              maxTagPlaceholder={handleMaxTagPlaceholder}
              mode='multiple'
              options={hostList}
              placeholder={targetType === TARGET_TYPE.SERVICE_INSTANCE ? t('服务实例', language) : t('主机', language)}
              searchValue={searchValue}
              value={hostValue}
              onChange={this.handleHostChange}
              onDropdownVisibleChange={this.handleHostDropdownVisibleChange}
              onFocus={this.handleHostFocus}
              onSearch={this.handleSearch}
            ></Select>
          </div>
        )}
      </LanguageContext.Consumer>
    );
  }
}
